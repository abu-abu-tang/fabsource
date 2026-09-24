"use client";

import { useMemo, useState } from "react";
import { Bot, KeyRound, MessageSquareText, RefreshCcw, ShieldAlert, Sparkles, Trophy, TrendingUp } from "lucide-react";
import type { AiAnalysis, FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { fallbackAnalysis } from "@/lib/calculations";
import { useFabSourceStore } from "@/lib/store";
import { formatCny } from "@/lib/utils";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";

interface ProviderSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

const defaultProvider: ProviderSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKey: "",
};

export function RecommendationPanel({ dataset, results, weights }: { dataset: FabSourceDataset; results: ScoreResult[]; weights: WeightSet }) {
  const addAudit = useFabSourceStore((state) => state.addAudit);
  const fallback = useMemo(() => fallbackAnalysis(results), [results]);
  const [generatedAnalysis, setGeneratedAnalysis] = useState<{ fingerprint: string; analysis: AiAnalysis } | null>(null);
  const [provider, setProvider] = useState<ProviderSettings>(() => {
    if (typeof window === "undefined") return defaultProvider;
    try {
      const stored = sessionStorage.getItem("fabsource-ai-provider");
      return stored ? { ...defaultProvider, ...JSON.parse(stored) as Partial<ProviderSettings> } : defaultProvider;
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

  function saveProvider(next: ProviderSettings) {
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
      addAudit({ type: "ai_analysis", description: "生成规则摘要（未配置模型 Key）" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, context }),
      });
      const payload = await response.json() as AiAnalysis & { error?: string };
      if (!response.ok) throw new Error(payload.error || "模型分析失败");
      setGeneratedAnalysis({ fingerprint: resultFingerprint, analysis: payload });
      addAudit({ type: "ai_analysis", description: `使用 ${provider.model} 生成采购分析` });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "模型分析失败，已回退到规则摘要。");
      setGeneratedAnalysis({ fingerprint: resultFingerprint, analysis: fallback });
    } finally {
      setLoading(false);
    }
  }

  if (!winner) {
    return <Card className="p-8 text-center text-sm text-slate-500">暂无可参与推荐的供应商，请先补全报价与技术数据。</Card>;
  }

  const tcoGap = runnerUp ? winner.tco.total - runnerUp.tco.total : 0;
  const purchaseGap = runnerUp ? winner.tco.purchase - runnerUp.tco.purchase : 0;

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Recommendation" title="首选、备选与谈判策略" description="推荐的落脚点不是一句“选谁”，而是说明为什么、代价是什么，以及签约前还需要锁住哪些条款。" />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden border-teal-200">
          <div className="bg-[linear-gradient(120deg,_#063f3d,_#0f766e)] p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="border-white/20 bg-white/10 text-white">首选方案 · Rank #1</Badge>
                <h3 className="mt-4 text-2xl font-semibold">{winner.supplierName}</h3>
                <p className="mt-1 text-sm text-teal-100/80">{winner.modelName}</p>
              </div>
              <Trophy className="size-8 text-amber-300" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/10 p-3"><p className="text-[11px] text-teal-100/70">综合分</p><p className="mt-1 text-2xl font-semibold">{winner.total.toFixed(1)}</p></div>
              <div className="rounded-lg bg-white/10 p-3"><p className="text-[11px] text-teal-100/70">五年 TCO</p><p className="mt-1 text-2xl font-semibold">{formatCny(winner.tco.total)}</p></div>
            </div>
          </div>
          <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
            <div className="bg-white p-4"><p className="text-xs text-slate-400">TCO 对第二名</p><p className="mt-1 font-semibold text-teal-700">{tcoGap >= 0 ? "节省" : "增加"} {formatCny(Math.abs(tcoGap))}</p></div>
            <div className="bg-white p-4"><p className="text-xs text-slate-400">采购价差异</p><p className="mt-1 font-semibold text-slate-800">{purchaseGap >= 0 ? "高" : "低"} {formatCny(Math.abs(purchaseGap))}</p></div>
            <div className="bg-white p-4"><p className="text-xs text-slate-400">硬门槛</p><p className="mt-1 font-semibold text-emerald-700">全部通过</p></div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2"><TrendingUp className="size-4 text-blue-700" /><h3 className="font-semibold text-slate-900">备选与议价锚点</h3></div>
            {runnerUp ? (
              <>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-4"><div><p className="font-semibold text-slate-900">{runnerUp.supplierName}</p><p className="text-xs text-slate-500">{runnerUp.modelName}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-900">{runnerUp.total.toFixed(1)} 分</p><p className="text-xs text-slate-500">{formatCny(runnerUp.tco.total)}</p></div></div>
                <p className="mt-3 text-xs leading-5 text-slate-500">保留第二名报价并锁定有效期，可作为双供、分批交付或服务条款谈判的替代方案。</p>
              </>
            ) : <p className="mt-3 text-sm text-slate-500">暂无第二名有效供应商。</p>}
          </Card>
          <Card className="border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-700" /><h3 className="font-semibold text-amber-900">不可忽略的风险</h3></div>
            <p className="mt-3 text-xs leading-5 text-amber-800">
              {disqualified.length > 0
                ? `${disqualified.map((result) => result.supplierName).join("、")} 未通过硬门槛。低价方案若缺少 SEMI S2 或本地备件支持，应进入技术整改清单，而不是在总分中“用折扣换来”。`
                : "当前没有硬门槛淘汰项，但仍需单列单点供应、汇率和关键备件交期的残余风险。"}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2"><MessageSquareText className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">采购摘要</h3><Badge tone={currentAnalysis.generatedBy === "model" ? "teal" : "neutral"}>{currentAnalysis.generatedBy === "model" ? "AI 辅助" : "规则摘要"}</Badge></div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{currentAnalysis.executiveSummary}</p>
          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Negotiation points</p>
            <div className="mt-3 space-y-3">
              {currentAnalysis.negotiationPoints.map((point, index) => <div key={`${point}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-700">{index + 1}</span>{point}</div>)}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><ShieldAlert className="size-4 text-amber-700" /><h3 className="font-semibold text-slate-900">签约前风险追问</h3></div>
          <div className="mt-4 space-y-3">
            {currentAnalysis.riskQuestions.map((question, index) => <div key={`${question}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-sm leading-6 text-slate-700">{question}</div>)}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2"><Bot className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">可选 AI 分析师（BYOK）</h3></div>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Key 仅保存在当前浏览器的 sessionStorage，仅在点击生成时转发给配置的 OpenAI 兼容服务；AI 输出不能修改评分和排名。无 Key 时使用上方规则摘要。</p>
          </div>
          <Button onClick={generateAnalysis} disabled={loading}><Sparkles className="size-4" />{loading ? "生成中…" : "生成采购摘要"}</Button>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
          <label className="rounded-lg border border-slate-200 p-3"><span className="text-[11px] text-slate-500">Base URL</span><input value={provider.baseUrl} onChange={(event) => saveProvider({ ...provider, baseUrl: event.target.value })} className="mt-1 w-full text-sm text-slate-800 outline-none" /></label>
          <label className="rounded-lg border border-slate-200 p-3"><span className="text-[11px] text-slate-500">Model</span><input value={provider.model} onChange={(event) => saveProvider({ ...provider, model: event.target.value })} className="mt-1 w-full text-sm text-slate-800 outline-none" /></label>
          <label className="rounded-lg border border-slate-200 p-3"><span className="flex items-center gap-1 text-[11px] text-slate-500"><KeyRound className="size-3" />API Key</span><input type="password" value={provider.apiKey} placeholder="不填写则使用规则摘要" onChange={(event) => saveProvider({ ...provider, apiKey: event.target.value })} className="mt-1 w-full text-sm text-slate-800 outline-none" /></label>
          <Button variant="secondary" onClick={() => saveProvider(defaultProvider)}><RefreshCcw className="size-4" />清空</Button>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </Card>
    </div>
  );
}

