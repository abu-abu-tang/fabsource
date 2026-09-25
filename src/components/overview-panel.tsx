"use client";

import type { FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { formatCompactCny, formatCny } from "@/lib/utils";
import { Badge, Button, Card, Metric, ScoreBar, SectionHeading } from "@/components/ui";
import type { WorkspaceTab } from "@/lib/store";

interface OverviewProps {
  dataset: FabSourceDataset;
  results: ScoreResult[];
  weights: WeightSet;
  onNavigate: (tab: WorkspaceTab) => void;
}

export function OverviewPanel({ dataset, results, weights, onNavigate }: OverviewProps) {
  const eligible = results.filter((result) => result.eligibility === "eligible");
  const winner = eligible[0];
  const runnerUp = eligible[1];
  const disqualified = results.filter((result) => result.eligibility === "disqualified");
  const cheapest = [...eligible].sort((a, b) => a.tco.total - b.tco.total)[0];
  const exactProfile = dataset.profiles.find((profile) => JSON.stringify(profile.weights) === JSON.stringify(weights));
  const priceGap = winner && runnerUp ? winner.tco.total - runnerUp.tco.total : 0;

  return (
    <div className="space-y-10">
      <section className="pb-8">
        <p className="text-sm text-slate-500">{dataset.project.buyer}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">{dataset.project.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{dataset.project.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => onNavigate("decision")}>查看决策分析</Button>
          <Button variant="secondary" onClick={() => onNavigate("quotes")}>检查报价口径</Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="当前首选" value={winner?.supplierName ?? "待确认"} note={winner?.modelName} tone="teal" />
        <Metric label="五年 TCO" value={winner ? formatCompactCny(winner.tco.total) : "—"} note={runnerUp ? `与次选相差 ${formatCompactCny(Math.abs(priceGap))}` : undefined} />
        <Metric label="最低价格方案" value={cheapest?.supplierName ?? "—"} note={cheapest ? formatCompactCny(cheapest.tco.total) : undefined} tone="amber" />
        <Metric label="硬门槛淘汰" value={`${disqualified.length} 家`} note={disqualified[0]?.supplierName ?? "全部通过"} tone="red" />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
        <div>
          <SectionHeading title="当前供应商排序" description="分数按当前权重实时计算，硬门槛未通过的供应商不参与推荐。" />
          <div className="mt-1">
            {results.map((result) => (
              <div key={result.supplierId} className="flex items-center gap-5 border-b border-slate-200 py-5">
                <div className="w-8 shrink-0 text-sm font-semibold text-slate-500">{result.rank ? `0${result.rank}` : "—"}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-slate-950">{result.supplierName}</p>
                    <Badge tone={result.eligibility === "eligible" ? "success" : result.eligibility === "disqualified" ? "danger" : "warning"}>
                      {result.eligibility === "eligible" ? "参与推荐" : result.eligibility === "disqualified" ? "硬门槛未通过" : "数据待补充"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{result.modelName} · {formatCny(result.tco.total)}</p>
                </div>
                <div className="w-28 text-right">
                  <p className="text-xl font-semibold text-slate-950">{result.total.toFixed(1)}</p>
                  <ScoreBar className="mt-2" value={result.total} tone={result.eligibility === "eligible" ? "teal" : "red"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">关键判断</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {disqualified.length > 0
                ? `${disqualified[0].supplierName} 报价较低，但未满足 SEMI S2 要求，不应仅凭价格进入晶圆厂设备采购候选。`
                : "全部供应商通过硬门槛，可继续比较五年成本、交付与供应风险。"}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">评估假设</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><dt className="text-slate-500">周期</dt><dd className="mt-1 font-medium text-slate-900">{dataset.assumptions.evaluationYears} 年</dd></div>
              <div><dt className="text-slate-500">数量</dt><dd className="mt-1 font-medium text-slate-900">{dataset.assumptions.quantity} 台</dd></div>
              <div><dt className="text-slate-500">运行时间</dt><dd className="mt-1 font-medium text-slate-900">{dataset.assumptions.annualOperatingHours.toLocaleString()} h/年</dd></div>
              <div><dt className="text-slate-500">停机损失</dt><dd className="mt-1 font-medium text-slate-900">{formatCompactCny(dataset.assumptions.downtimeCostCnyPerHour)}/h</dd></div>
            </dl>
            <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">当前策略：{exactProfile?.name ?? "自定义权重"}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

