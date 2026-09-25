"use client";

import { useMemo, useState } from "react";
import type { AiAnalysis, FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { requestDirectAiAnalysis, type AiProviderSettings } from "@/lib/ai-client";
import { fallbackAnalysis } from "@/lib/calculations";
import { useFabSourceStore } from "@/lib/store";
import { formatCny } from "@/lib/utils";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";


const defaultProvider: AiProviderSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKey: "",
};

export function RecommendationPanel({ dataset, results, weights }: { dataset: FabSourceDataset; results: ScoreResult[]; weights: WeightSet }) {
  const addAudit = useFabSourceStore((state) => state.addAudit);
  const fallback = useMemo(() => fallbackAnalysis(results), [results]);
  const [generatedAnalysis, setGeneratedAnalysis] = useState<{ fingerprint: string; analysis: AiAnalysis } | null>(null);
  const [provider, setProvider] = useState<AiProviderSettings>(() => {
    if (typeof window === "undefined") return defaultProvider;
    try {
      const stored = sessionStorage.getItem("fabsource-ai-provider");
      return stored ? { ...defaultProvider, ...JSON.parse(stored) as Partial<AiProviderSettings> } : defaultProvider;
    } catch {
      return defaultProvider;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const winner = results.find((result) => result.rank === 1);
  const runnerUp = results.find((result) => result.rank === 2);
  const disqualified = results.filter((result) => result.eligibility === "disqualified");
  const resultFingerprint = results.map((result) => `${result.supplierId}:${result.total.toFixed(2)}:${result.rank}`).join("|");
  const currentAnalysis = generatedAnalysis?.fingerprint === resultFingerprint ? generatedAnalysis.analysis : fallback;

  function saveProvider(next: AiProviderSettings) {
    setProvider(next);
    sessionStorage.setItem("fabsource-ai-provider", JSON.stringify(next));
  }

  async function generateAnalysis() {
    setLoading(true);
    setError("");
    const context = {
      projectName: dataset.project.name,
      weights,
      results: results.map((result) => ({
        supplier: result.supplierName,
        model: result.modelName,
        rank: result.rank,
        eligibility: result.eligibility,
        total: Number(result.total.toFixed(2)),
        tco: Number(result.tco.total.toFixed(2)),
        hardGateFailures: result.hardGateFailures,
      })),
    };

    if (!provider.apiKey) {
      setGeneratedAnalysis({ fingerprint: resultFingerprint, analysis: fallback });
      addAudit({ type: "ai_analysis", description: "生成规则摘要" });
      setLoading(false);
      return;
    }

    try {
      let payload: AiAnalysis & { error?: string };
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
        payload = await requestDirectAiAnalysis(provider, context);
      } else {
        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, context }),
        });
        payload = await response.json() as AiAnalysis & { error?: string };
        if (!response.ok) throw new Error(payload.error || "模型分析失败");
      }
      setGeneratedAnalysis({ fingerprint: resultFingerprint, analysis: payload });
      addAudit({ type: "ai_analysis", description: `使用 ${provider.model} 生成采购分析` });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "模型分析失败，已使用规则摘要。");
      setGeneratedAnalysis({ fingerprint: resultFingerprint, analysis: fallback });
    } finally {
      setLoading(false);
    }
  }

  if (!winner) {
    return <Card className="p-8 text-center text-sm text-slate-500">暂无可参与推荐的供应商。</Card>;
  }

  const tcoGap = runnerUp ? winner.tco.total - runnerUp.tco.total : 0;

  return (
    <div className="space-y-10">
      <SectionHeading title="首选、备选与谈判策略" description="说明推荐结果、主要取舍和签约前需要锁定的条款。" />

      <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="border-t-2 border-teal-800 pt-6">
          <p className="text-sm font-medium text-teal-800">首选方案 · Rank #1</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950">{winner.supplierName}</h2>
          <p className="mt-2 text-base text-slate-500">{winner.modelName}</p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-slate-200 py-6 sm:grid-cols-3">
            <div><dt className="text-sm text-slate-500">综合分</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{winner.total.toFixed(1)}</dd></div>
            <div><dt className="text-sm text-slate-500">五年 TCO</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatCny(winner.tco.total)}</dd></div>
            <div><dt className="text-sm text-slate-500">对第二名</dt><dd className="mt-2 text-xl font-semibold text-teal-800">{tcoGap >= 0 ? "节省" : "增加"} {formatCny(Math.abs(tcoGap))}</dd></div>
          </dl>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">备选方案</h2>
            {runnerUp ? (
              <div className="mt-4 border-t border-slate-300 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-medium text-slate-900">{runnerUp.supplierName}</p><p className="mt-1 text-sm text-slate-500">{runnerUp.modelName}</p></div>
                  <div className="text-right"><p className="font-medium text-slate-900">{runnerUp.total.toFixed(1)} 分</p><p className="mt-1 text-sm text-slate-500">{formatCny(runnerUp.tco.total)}</p></div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">保留报价作为双供、分批交付和服务条款议价的备选。</p>
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">暂无第二名有效供应商。</p>}
          </div>
          <Card className="border-amber-200 bg-amber-50/50 p-5">
            <h2 className="text-base font-semibold text-amber-900">需确认的风险</h2>
            <p className="mt-3 text-sm leading-6 text-amber-800">
              {disqualified.length > 0
                ? `${disqualified.map((result) => result.supplierName).join("、")} 未通过硬门槛，应先完成合规或技术整改。`
                : "仍需确认单点供应、汇率波动和关键备件交期。"}
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-3"><h2 className="text-lg font-semibold text-slate-950">采购摘要</h2><Badge tone={currentAnalysis.generatedBy === "model" ? "teal" : "neutral"}>{currentAnalysis.generatedBy === "model" ? "AI 辅助" : "规则摘要"}</Badge></div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{currentAnalysis.executiveSummary}</p>
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            {currentAnalysis.negotiationPoints.map((point, index) => (
              <div key={`${point}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="font-medium text-teal-800">{index + 1}.</span>{point}</div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-950">签约前风险追问</h2>
          <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {currentAnalysis.riskQuestions.map((question, index) => <p key={`${question}-${index}`} className="py-4 text-sm leading-6 text-slate-700">{question}</p>)}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">可选 AI 分析</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Key 仅保存在当前会话，AI 不修改评分和排名。无 Key 时使用规则摘要。</p>
          </div>
          <Button onClick={generateAnalysis} disabled={loading}>{loading ? "生成中…" : "生成采购摘要"}</Button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
          <label className="border-t border-slate-300 pt-3"><span className="text-sm text-slate-500">Base URL</span><input value={provider.baseUrl} onChange={(event) => saveProvider({ ...provider, baseUrl: event.target.value })} className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none" /></label>
          <label className="border-t border-slate-300 pt-3"><span className="text-sm text-slate-500">Model</span><input value={provider.model} onChange={(event) => saveProvider({ ...provider, model: event.target.value })} className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none" /></label>
          <label className="border-t border-slate-300 pt-3"><span className="text-sm text-slate-500">API Key</span><input type="password" value={provider.apiKey} placeholder="不填写则使用规则摘要" onChange={(event) => saveProvider({ ...provider, apiKey: event.target.value })} className="mt-2 w-full bg-transparent text-sm text-slate-800 outline-none" /></label>
          <Button variant="secondary" onClick={() => saveProvider(defaultProvider)}>清空</Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}



