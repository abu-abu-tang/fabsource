"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { FabSourceDataset, ScoreResult, WeightSet } from "@/lib/types";
import { normalizeWeights, rankSuppliers } from "@/lib/calculations";
import { useFabSourceStore } from "@/lib/store";
import { cn, formatCompactCny, formatCny } from "@/lib/utils";
import { Badge, Button, Card, ScoreBar, SectionHeading } from "@/components/ui";

const dimensions: Array<{ key: keyof WeightSet; label: string }> = [
  { key: "tco", label: "五年 TCO" },
  { key: "technical", label: "技术符合度" },
  { key: "deliveryService", label: "交付与服务" },
  { key: "qualityReliability", label: "质量与可靠性" },
  { key: "supplyRisk", label: "供应风险" },
];

const colors = ["#0f766e", "#0f172a", "#64748b", "#b45309"];

function heatColor(score: number, passed = true) {
  if (!passed) return "bg-red-50 text-red-700";
  if (score >= 95) return "bg-emerald-50 text-emerald-800";
  if (score >= 85) return "bg-teal-50 text-teal-800";
  if (score >= 70) return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
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
    <div className="space-y-10">
      <SectionHeading title="多准则决策与权重敏感性" description="报价归一、TCO 计算和评分结果均可复核；硬门槛不随权重变化。" />

      <section className="grid gap-8 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">决策策略</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {dataset.profiles.map((profile) => (
                <Button key={profile.id} size="sm" variant={selectedProfileId === profile.id ? "primary" : "secondary"} onClick={() => selectProfile(profile.id)}>
                  {profile.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-slate-950">权重</h2>
              <span className="text-sm text-slate-500">归一后 100%</span>
            </div>
            <div className="mt-5 space-y-5">
              {dimensions.map((dimension) => (
                <div key={dimension.key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700">{dimension.label}</span>
                    <span className="font-medium text-teal-800">{normalized[dimension.key].toFixed(1)}%</span>
                  </div>
                  <input
                    aria-label={`${dimension.label}权重`}
                    type="range"
                    min="0"
                    max="60"
                    value={weights[dimension.key]}
                    onChange={(event) => setWeight(dimension.key, Number(event.target.value))}
                    className="mt-3 w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-950">场景假设</h2>
          <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { key: "quantity" as const, label: "采购数量（台）", value: dataset.assumptions.quantity, step: 1 },
              { key: "evaluationYears" as const, label: "评估周期（年）", value: dataset.assumptions.evaluationYears, step: 1 },
              { key: "annualOperatingHours" as const, label: "年运行小时", value: dataset.assumptions.annualOperatingHours, step: 100 },
              { key: "electricityPriceCnyPerKwh" as const, label: "电价（元/kWh）", value: dataset.assumptions.electricityPriceCnyPerKwh, step: 0.05 },
              { key: "downtimeCostCnyPerHour" as const, label: "停机损失（元/h）", value: dataset.assumptions.downtimeCostCnyPerHour, step: 1000 },
            ].map((assumption) => (
              <label key={assumption.key} className="border-t border-slate-300 pt-3">
                <span className="text-sm text-slate-500">{assumption.label}</span>
                <input
                  type="number"
                  min="0"
                  step={assumption.step}
                  value={assumption.value}
                  onChange={(event) => updateAssumption(assumption.key, Math.max(0, Number(event.target.value)))}
                  className="mt-2 w-full bg-transparent text-xl font-semibold text-slate-950 outline-none"
                />
              </label>
            ))}
            <div className="border-t border-slate-300 pt-3">
              <p className="text-sm text-slate-500">当前首选</p>
              <p className="mt-2 text-xl font-semibold text-teal-800">{results.find((result) => result.rank === 1)?.supplierName ?? "待确认"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">五年 TCO 构成</h2>
          <p className="mt-1 text-sm text-slate-500">残值已从最终 TCO 扣减，未计入堆叠图形。</p>
          <div className="mt-5 h-80" role="img" aria-label="五年总拥有成本构成柱状图">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tcoChartData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}万`} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCompactCny(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="purchase" name="采购价" stackId="tco" fill="#0f766e" />
                <Bar dataKey="logistics" name="物流/安装" stackId="tco" fill="#5eead4" />
                <Bar dataKey="energy" name="能耗" stackId="tco" fill="#0f172a" />
                <Bar dataKey="maintenance" name="维护/服务" stackId="tco" fill="#94a3b8" />
                <Bar dataKey="downtime" name="停机损失" stackId="tco" fill="#d97706" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">前两名五维画像</h2>
          <p className="mt-1 text-sm text-slate-500">分数反映当前假设和可比较数据，不替代技术复审。</p>
          <div className="mt-5 h-80" role="img" aria-label="五年总拥有成本构成柱状图">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "#475569" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                {topTwo.map((result, index) => (
                  <Radar key={result.supplierId} name={result.supplierName} dataKey={result.supplierName} stroke={colors[index]} fill={colors[index]} fillOpacity={0.12} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => Number(value).toFixed(1)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">供应商评分卡</h2>
          <span className="text-sm text-slate-500">点击查看计算轨迹</span>
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
                  className={cn("border-t border-slate-100", selected?.supplierId === result.supplierId ? "bg-teal-50/60" : "hover:bg-slate-50")}
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      aria-pressed={selected?.supplierId === result.supplierId}
                      onClick={() => setSelectedSupplier(result.supplierId)}
                      className="flex items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
                    >
                      <span className="w-6 text-sm font-semibold text-slate-500">{result.rank ? `0${result.rank}` : "—"}</span>
                      <span><span className="block font-medium text-slate-900">{result.supplierName}</span><span className="mt-1 block text-xs text-slate-500">{result.modelName}</span></span>
                    </button>
                  </td>
                  {dimensions.map((dimension) => (
                    <td key={dimension.key} className="px-4 py-4">
                      <p className="mb-2 font-medium text-slate-700">{result.subscores[dimension.key].toFixed(1)}</p>
                      <ScoreBar value={result.subscores[dimension.key]} tone={result.eligibility === "eligible" ? "teal" : "red"} />
                    </td>
                  ))}
                  <td className="px-5 py-4"><p className="text-lg font-semibold text-slate-950">{result.total.toFixed(1)}</p><p className="mt-1 text-xs text-slate-500">{result.eligibility === "eligible" ? "参与排名" : "不参与排名"}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">技术符合度热力图</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead><tr><th className="pb-3 text-left font-medium text-slate-500">指标</th>{results.map((result) => <th key={result.supplierId} className="pb-3 text-center font-medium text-slate-500">{result.supplierName}</th>)}</tr></thead>
              <tbody>
                {dataset.requirements.map((requirement, index) => (
                  <tr key={requirement.key}>
                    <td className="border-t border-slate-100 py-3 pr-3 text-slate-700">{requirement.labelZh}</td>
                    {results.map((result) => {
                      const row = result.technical.rows[index];
                      return <td key={result.supplierId} className="border-t border-slate-100 p-1"><div className={cn("rounded-md px-3 py-2 text-center font-medium", heatColor(row?.score ?? 0, row?.passed))}>{row?.score.toFixed(0)}</div></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">计算轨迹</h2><Badge tone="neutral">{selected?.supplierName}</Badge></div>
            <div className="mt-4 space-y-3">
              {selected?.calculationTrace.map((line) => <p key={line} className="border-l border-slate-300 pl-3 text-sm leading-6 text-slate-600">{line}</p>)}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-6 border-t border-slate-200 pt-5">
              <div><p className="text-sm text-slate-500">五年 TCO</p><p className="mt-1 font-medium text-slate-900">{selected ? formatCny(selected.tco.total) : "—"}</p></div>
              <div><p className="text-sm text-slate-500">能耗</p><p className="mt-1 font-medium text-slate-900">{selected ? `${Math.round(selected.tco.energyKwh).toLocaleString()} kWh` : "—"}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">策略敏感性</h2>
            <div className="mt-5 h-64" role="img" aria-label="不同策略下供应商综合得分敏感性折线图">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="supplier" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {dataset.profiles.map((profile, index) => <Line key={profile.id} type="monotone" dataKey={profile.name} stroke={colors[index]} strokeWidth={2} dot={{ r: 3 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">不同策略下的首选</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {profileResults.map(({ profile, results: profileRanks }) => {
            const winner = profileRanks.find((result) => result.rank === 1);
            return (
              <div key={profile.id} className="border-t border-slate-300 pt-4">
                <p className="text-sm text-slate-500">{profile.name}</p>
                <p className="mt-2 font-semibold text-slate-950">{winner?.supplierName ?? "无有效方案"}</p>
                <p className="mt-1 text-sm text-slate-500">{winner ? `${winner.total.toFixed(1)} 分 · ${formatCompactCny(winner.tco.total)}` : profile.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}



