"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, Factory, Layers3, ShieldCheck, TrendingDown } from "lucide-react";
import type { FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { formatCompactCny, formatCny, formatPercent } from "@/lib/utils";
import { Badge, Button, Card, Metric, ScoreBar, SectionHeading } from "@/components/ui";
import type { WorkspaceTab } from "@/lib/store";

interface OverviewProps {
  dataset: FabSourceDataset;
  results: ScoreResult[];
  weights: WeightSet;
  onNavigate: (tab: WorkspaceTab) => void;
}

const stepLabels = [
  ["01", "需求定义", "16 项技术与商务门槛"],
  ["02", "报价归一", "币种、税费、Incoterm"],
  ["03", "TCO 建模", "采购价不等于拥有成本"],
  ["04", "多准则评分", "权重透明、结果可复算"],
  ["05", "谈判决策", "首选、备选与条款清单"],
] as const;

export function OverviewPanel({ dataset, results, weights, onNavigate }: OverviewProps) {
  const eligible = results.filter((result) => result.eligibility === "eligible");
  const winner = eligible[0];
  const exactProfile = dataset.profiles.find((profile) => JSON.stringify(profile.weights) === JSON.stringify(weights));
  const runnerUp = eligible[1];
  const disqualified = results.filter((result) => result.eligibility === "disqualified");
  const cheapest = [...eligible].sort((a, b) => a.tco.total - b.tco.total)[0];
  const priceGap = winner && runnerUp ? winner.tco.total - runnerUp.tco.total : 0;

  return (
    <div className="min-w-0 space-y-6">
      <Card className="overflow-hidden border-teal-900/10 bg-[linear-gradient(118deg,_#062e2d_0%,_#0f766e_58%,_#14b8a6_100%)] text-white">
        <div className="grid gap-7 p-6 lg:grid-cols-[1.35fr_.65fr] lg:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white">Decision Cockpit</Badge>
              <Badge className="border-white/20 bg-white/10 text-white">教学模拟数据</Badge>
            </div>
            <h2 className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">把最低报价，变成经得起产线停机考验的采购决策</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-teal-50/80">
              面向 12 英寸晶圆厂 CVD Sub-fab，将技术硬门槛、五年 TCO、现场服务与供应韧性放进同一套可审计模型。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="border-white bg-white text-teal-900 hover:bg-teal-50" onClick={() => onNavigate("decision")}>
                查看决策分析 <ArrowRight className="size-4" />
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => onNavigate("quotes")}>
                检查报价口径
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-teal-100/75">有效供应商</p>
              <p className="mt-2 text-3xl font-semibold">{eligible.length}<span className="ml-1 text-sm font-normal text-teal-100/70">/ {results.length}</span></p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-teal-100/75">采购数量</p>
              <p className="mt-2 text-3xl font-semibold">{dataset.assumptions.quantity}<span className="ml-1 text-sm font-normal text-teal-100/70">台</span></p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-teal-100/75">当前策略</p>
              <p className="mt-1 text-base font-semibold">{exactProfile?.name ?? "自定义权重"}</p>
              <p className="mt-1 text-xs text-teal-100/70">TCO {weights.tco.toFixed(0)}% · 技术 {weights.technical.toFixed(0)}% · 交付 {weights.deliveryService.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="当前首选" value={winner?.supplierName ?? "待确认"} note={winner?.modelName} tone="teal" />
        <Metric label="首选五年 TCO" value={winner ? formatCompactCny(winner.tco.total) : "—"} note={runnerUp ? `与次选相差 ${formatCompactCny(Math.abs(priceGap))}` : undefined} />
        <Metric label="最佳价格方案" value={cheapest?.supplierName ?? "—"} note={cheapest ? formatCompactCny(cheapest.tco.total) : undefined} tone="amber" />
        <Metric label="硬门槛淘汰" value={`${disqualified.length} 家`} note={disqualified[0]?.supplierName ?? "全部通过"} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_.82fr]">
        <Card className="p-5">
          <SectionHeading eyebrow="Ranking" title="当前供应商排序" description="排名由右下权重实时重算；硬门槛淘汰供应商永远不进入推荐位。" />
          <div className="mt-5 space-y-3">
            {results.map((result) => (
              <div key={result.supplierId} className="flex items-center gap-4 rounded-lg border border-slate-100 p-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                  {result.rank ? `#${result.rank}` : "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{result.supplierName}</p>
                    <Badge tone={result.eligibility === "eligible" ? "success" : result.eligibility === "disqualified" ? "danger" : "warning"}>
                      {result.eligibility === "eligible" ? "参与推荐" : result.eligibility === "disqualified" ? "硬门槛未通过" : "数据待补充"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{result.modelName} · {formatCny(result.tco.total)}</p>
                </div>
                <div className="w-28 text-right">
                  <p className="text-lg font-semibold text-slate-950">{result.total.toFixed(1)}</p>
                  <ScoreBar className="mt-1.5" value={result.total} tone={result.eligibility === "eligible" ? "teal" : "red"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><AlertTriangle className="size-5" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">面试官应看到的业务洞察</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {disqualified.length > 0
                    ? `${disqualified[0].supplierName} 的采购价格较低，但缺少 SEMI S2 证据包，若用于晶圆厂设备会触发安全审查风险，因此不应因低价直接入围。`
                    : "所有供应商均通过硬门槛，下一步应观察权重变化是否会让综合成本与停机风险发生冲突。"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">场景假设</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><Layers3 className="mb-2 size-4 text-teal-700" /><p className="text-xs text-slate-500">评估周期</p><p className="font-semibold">{dataset.assumptions.evaluationYears} 年</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><Clock3 className="mb-2 size-4 text-teal-700" /><p className="text-xs text-slate-500">年运行</p><p className="font-semibold">{dataset.assumptions.annualOperatingHours.toLocaleString()} h</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><CircleDollarSign className="mb-2 size-4 text-teal-700" /><p className="text-xs text-slate-500">电价</p><p className="font-semibold">¥{dataset.assumptions.electricityPriceCnyPerKwh}/kWh</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><TrendingDown className="mb-2 size-4 text-teal-700" /><p className="text-xs text-slate-500">停机损失</p><p className="font-semibold">{formatCompactCny(dataset.assumptions.downtimeCostCnyPerHour)}/h</p></div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <SectionHeading eyebrow="Workflow" title="从需求到决策的完整链路" />
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {stepLabels.map(([number, title, note], index) => (
            <div key={number} className="relative rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700">{number}</span>
                {index < 4 ? <ArrowRight className="size-3 text-slate-300" /> : <CheckCircle2 className="size-3 text-teal-600" />}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4"><Factory className="size-5 text-teal-700" /><div><p className="text-xs text-slate-500">采购角色</p><p className="text-sm font-semibold">{dataset.project.buyer}</p></div></Card>
        <Card className="flex items-center gap-3 p-4"><ShieldCheck className="size-5 text-teal-700" /><div><p className="text-xs text-slate-500">合规要求</p><p className="text-sm font-semibold">SEMI S2 / CE / Safety interlock</p></div></Card>
        <Card className="flex items-center gap-3 p-4"><CheckCircle2 className="size-5 text-teal-700" /><div><p className="text-xs text-slate-500">当前数据完整度</p><p className="text-sm font-semibold">{formatPercent((eligible.length / results.length) * 100)} 可参与推荐</p></div></Card>
      </div>
    </div>
  );
}



