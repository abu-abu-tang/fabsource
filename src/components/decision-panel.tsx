"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Calculator, ChevronRight, Gauge, SlidersHorizontal } from "lucide-react";
import type { FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { rankSuppliers, normalizeWeights } from "@/lib/calculations";
import { useFabSourceStore } from "@/lib/store";
import { cn, formatCompactCny, formatCny } from "@/lib/utils";
import { Badge, Button, Card, ScoreBar, SectionHeading } from "@/components/ui";

const dimensions: Array<{ key: keyof WeightSet; label: string; note: string }> = [
  { key: "tco", label: "五年 TCO", note: "越低越好" },
  { key: "technical", label: "技术符合度", note: "规格加权" },
  { key: "deliveryService", label: "交付与服务", note: "交期、响应" },
  { key: "qualityReliability", label: "质量与可靠性", note: "MTBF、故障" },
  { key: "supplyRisk", label: "供应风险", note: "韧性、备件" },
];

const colors = ["#0f766e", "#0369a1", "#7c3aed", "#c2410c"];

function heatColor(score: number, passed = true) {
  if (!passed) return "bg-red-100 text-red-700";
  if (score >= 95) return "bg-emerald-100 text-emerald-800";
  if (score >= 85) return "bg-teal-50 text-teal-800";
  if (score >= 70) return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-700";
}

export function DecisionPanel({ dataset, results, weights }: { dataset: FabSourceDataset; results: ScoreResult[]; weights: WeightSet }) {
  const { selectProfile, setWeight, updateAssumption, selectedProfileId } = useFabSourceStore();
  const [selectedSupplier, setSelectedSupplier] = useState(results.find((result) => result.rank === 1)?.supplierId ?? results[0]?.supplierId);
  const normalized = normalizeWeights(weights);
  const selected = results.find((result) => result.supplierId === selectedSupplier) ?? results[0];
  const topTwo = results.filter((result) => result.eligibility === "eligible").slice(0, 2);

  const profileResults = useMemo(
    () => dataset.profiles.map((profile) => ({ profile, results: rankSuppliers(dataset, profile.weights) })),
    [dataset],
  );

  const tcoChartData = results.map((result) => ({
    name: result.supplierName,
    purchase: result.tco.purchase,
    logistics: result.tco.freightDuty + result.tco.installation,
    energy: result.tco.energy,
    maintenance: result.tco.maintenance + result.tco.serviceContract,
    downtime: result.tco.downtime,
  }));

  const radarData = dimensions.map((dimension) => ({
    dimension: dimension.label,
    ...Object.fromEntries(topTwo.map((result) => [result.supplierName, result.subscores[dimension.key]])),
  }));

  const sensitivityData = dataset.suppliers.map((supplier) => ({
    supplier: supplier.nameZh,
    ...Object.fromEntries(profileResults.map(({ profile, results: profileRanks }) => [
      profile.name,
      profileRanks.find((result) => result.supplierId === supplier.id)?.total ?? 0,
    ])),
  }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Decision Model"
        title="多准则决策与权重敏感性"
        description="评分不是黑箱：先归一报价，再计算 TCO，最后按显式权重合成 0-100 分；硬门槛淘汰不受权重影响。"
        action={<Badge tone="teal"><Calculator className="mr-1 size-3" />所有结果可复算</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[.82fr_1.18fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">决策权重</h3></div>
          <p className="mt-1 text-xs leading-5 text-slate-500">原始权重合计 {Object.values(weights).reduce((sum, value) => sum + value, 0).toFixed(0)}%，系统会归一化后计算。</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {dataset.profiles.map((profile) => (
              <Button key={profile.id} size="sm" variant={selectedProfileId === profile.id ? "primary" : "secondary"} onClick={() => selectProfile(profile.id)}>
                {profile.name}
              </Button>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {dimensions.map((dimension) => (
              <div key={dimension.key}>
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-sm font-medium text-slate-800">{dimension.label}</p><p className="text-[11px] text-slate-400">{dimension.note}</p></div>
                  <span className="text-sm font-semibold text-teal-700">{normalized[dimension.key].toFixed(1)}%</span>
                </div>
                <input
                  aria-label={`${dimension.label}权重`}
                  type="range"
                  min="0"
                  max="60"
                  value={weights[dimension.key]}
                  onChange={(event) => setWeight(dimension.key, Number(event.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-teal-700"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Gauge className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">场景假设</h3></div>
            <Badge tone="warning">教学模拟值</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "quantity" as const, label: "采购数量（台）", value: dataset.assumptions.quantity, step: 1 },
              { key: "evaluationYears" as const, label: "评估周期（年）", value: dataset.assumptions.evaluationYears, step: 1 },
              { key: "annualOperatingHours" as const, label: "年运行小时", value: dataset.assumptions.annualOperatingHours, step: 100 },
              { key: "electricityPriceCnyPerKwh" as const, label: "电价（元/kWh）", value: dataset.assumptions.electricityPriceCnyPerKwh, step: 0.05 },
              { key: "downtimeCostCnyPerHour" as const, label: "停机损失（元/h）", value: dataset.assumptions.downtimeCostCnyPerHour, step: 1000 },
            ].map((assumption) => (
              <label key={assumption.key} className="rounded-lg border border-slate-200 p-3">
                <span className="text-[11px] font-medium text-slate-500">{assumption.label}</span>
                <input
                  type="number"
                  min="0"
                  step={assumption.step}
                  value={assumption.value}
                  onChange={(event) => updateAssumption(assumption.key, Math.max(0, Number(event.target.value)))}
                  className="mt-2 w-full bg-transparent text-lg font-semibold text-slate-950 outline-none"
                />
              </label>
            ))}
            <div className="rounded-lg bg-slate-950 p-3 text-white">
              <p className="text-[11px] text-slate-300">当前首选</p>
              <p className="mt-2 truncate text-sm font-semibold">{results.find((result) => result.rank === 1)?.supplierName ?? "待确认"}</p>
              <p className="mt-1 text-[11px] text-slate-400">{results.find((result) => result.rank === 1)?.modelName}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">五年 TCO 构成</h3>
          <p className="mt-1 text-xs text-slate-500">费用按批次折算为人民币；残值未计入堆叠图形，但已从最终 TCO 扣减。</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcoChartData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}万`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCompactCny(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="purchase" name="采购价" stackId="tco" fill="#0f766e" />
                <Bar dataKey="logistics" name="物流/安装" stackId="tco" fill="#14b8a6" />
                <Bar dataKey="energy" name="能耗" stackId="tco" fill="#0369a1" />
                <Bar dataKey="maintenance" name="维护/服务" stackId="tco" fill="#7c3aed" />
                <Bar dataKey="downtime" name="停机损失" stackId="tco" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">前两名五维画像</h3>
          <p className="mt-1 text-xs text-slate-500">分数不是绝对真值，而是对当前假设和可比较数据的一致化表达。</p>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#475569" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                {topTwo.map((result, index) => (
                  <Radar key={result.supplierId} name={result.supplierName} dataKey={result.supplierName} stroke={colors[index]} fill={colors[index]} fillOpacity={0.16} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => Number(value).toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div><h3 className="font-semibold text-slate-900">供应商评分卡</h3><p className="mt-1 text-xs text-slate-500">点击任意供应商查看计算轨迹。</p></div>
          <Badge tone="neutral">0-100 分</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">排名 / 供应商</th>
                {dimensions.map((dimension) => <th key={dimension.key} className="min-w-32 px-4 py-3 font-medium">{dimension.label}</th>)}
                <th className="min-w-28 px-5 py-3 font-medium">综合得分</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result.supplierId}
                  onClick={() => setSelectedSupplier(result.supplierId)}
                  className={cn("cursor-pointer border-t border-slate-100 transition-colors", selected?.supplierId === result.supplierId ? "bg-teal-50/60" : "hover:bg-slate-50")}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">{result.rank ? `#${result.rank}` : "—"}</div>
                      <div><p className="font-semibold text-slate-900">{result.supplierName}</p><p className="text-[11px] text-slate-400">{result.modelName}</p></div>
                    </div>
                  </td>
                  {dimensions.map((dimension) => (
                    <td key={dimension.key} className="px-4 py-4">
                      <p className="mb-1.5 font-medium text-slate-700">{result.subscores[dimension.key].toFixed(1)}</p>
                      <ScoreBar value={result.subscores[dimension.key]} tone={result.eligibility === "eligible" ? "teal" : "red"} />
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <p className="text-lg font-semibold text-slate-950">{result.total.toFixed(1)}</p>
                    <p className="text-[11px] text-slate-400">{result.eligibility === "eligible" ? "参与排名" : "不参与排名"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">技术符合度热力图</h3>
          <p className="mt-1 text-xs text-slate-500">红色为硬门槛或显著低分；同一评分在人工复核前不应替代技术部门签字。</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead><tr><th className="pb-3 text-left font-medium text-slate-500">指标</th>{results.map((result) => <th key={result.supplierId} className="pb-3 text-center font-medium text-slate-500">{result.supplierName}</th>)}</tr></thead>
              <tbody>
                {dataset.requirements.map((requirement, index) => (
                  <tr key={requirement.key}>
                    <td className="border-t border-slate-100 py-2 pr-3 text-slate-700">{requirement.labelZh}</td>
                    {results.map((result) => {
                      const row = result.technical.rows[index];
                      return <td key={result.supplierId} className="border-t border-slate-100 p-1"><div className={cn("rounded-md px-2 py-1.5 text-center font-semibold", heatColor(row?.score ?? 0, row?.passed))}>{row?.score.toFixed(0)}</div></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">策略敏感性</h3>
            <p className="mt-1 text-xs text-slate-500">同一数据集在四种预设策略下的综合得分；排名变化用于暴露业务偏好，而不是操纵结果。</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="supplier" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {dataset.profiles.map((profile, index) => <Line key={profile.id} type="monotone" dataKey={profile.name} stroke={colors[index]} strokeWidth={2} dot={{ r: 3 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">计算轨迹</h3><Badge tone="info">{selected?.supplierName}</Badge></div>
            <div className="mt-3 space-y-2">
              {selected?.calculationTrace.map((line) => (
                <div key={line} className="flex gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600"><ChevronRight className="mt-1 size-3 shrink-0 text-teal-700" />{line}</div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3"><p className="text-[11px] text-slate-400">五年 TCO</p><p className="mt-1 font-semibold text-slate-900">{selected ? formatCny(selected.tco.total) : "—"}</p></div>
              <div className="rounded-lg border border-slate-200 p-3"><p className="text-[11px] text-slate-400">能耗</p><p className="mt-1 font-semibold text-slate-900">{selected ? `${Math.round(selected.tco.energyKwh).toLocaleString()} kWh` : "—"}</p></div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900">四套预设策略下的首选</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {profileResults.map(({ profile, results: profileRanks }, index) => {
            const winner = profileRanks.find((result) => result.rank === 1);
            return (
              <div key={profile.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between"><Badge tone={index === 0 ? "teal" : "neutral"}>{profile.name}</Badge><span className="text-xs text-slate-400">{profile.weights.tco}% TCO</span></div>
                <p className="mt-4 font-semibold text-slate-900">{winner?.supplierName ?? "无有效方案"}</p>
                <p className="mt-1 text-xs text-slate-500">{winner ? `${winner.total.toFixed(1)} 分 · ${formatCompactCny(winner.tco.total)}` : profile.description}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

