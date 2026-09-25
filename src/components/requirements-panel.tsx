"use client";

import type { FabSourceDataset, ScoreResult, SpecValue } from "@/lib/types";
import { Badge, Card, ScoreBar, SectionHeading } from "@/components/ui";

function displayValue(value: SpecValue, unit: string) {
  if (typeof value === "boolean") return value ? "支持" : "不支持";
  if (typeof value === "number") return `${value.toLocaleString("zh-CN")}${unit ? ` ${unit}` : ""}`;
  return value;
}

export function RequirementsPanel({ dataset, results }: { dataset: FabSourceDataset; results: ScoreResult[] }) {
  const mandatoryCount = dataset.requirements.filter((requirement) => requirement.mandatory).length;
  const hardFailures = results.flatMap((result) => result.hardGateFailures.map((failure) => ({ supplier: result.supplierName, failure })));

  return (
    <div className="space-y-8">
      <SectionHeading title="技术规格与硬门槛" description="强制性要求用于排除合规和技术风险，加权项用于比较通过门槛后的方案质量。" />

      <section className="grid gap-6 border-b border-slate-200 pb-6 text-sm sm:grid-cols-3">
        <div><span className="text-slate-500">规格项</span><p className="mt-1 text-lg font-medium text-slate-950">{dataset.requirements.length} 项</p></div>
        <div><span className="text-slate-500">强制性要求</span><p className="mt-1 text-lg font-medium text-slate-950">{mandatoryCount} 项</p></div>
        <div><span className="text-slate-500">发现硬门槛问题</span><p className="mt-1 text-lg font-medium text-red-700">{hardFailures.length} 项</p></div>
      </section>

      {hardFailures.length > 0 && (
        <Card className="border-red-200 p-5">
          <h2 className="text-base font-semibold text-red-800">硬门槛未通过</h2>
          <div className="mt-3 space-y-2">
            {hardFailures.map((item) => (
              <p key={`${item.supplier}-${item.failure}`} className="text-sm text-red-700"><strong className="font-medium">{item.supplier}</strong>：{item.failure}</p>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {results.map((result) => (
          <div key={result.supplierId} className="border-t border-slate-300 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-medium text-slate-950">{result.supplierName}</p><p className="mt-1 text-sm text-slate-500">{result.modelName}</p></div>
              <Badge tone={result.eligibility === "eligible" ? "success" : "danger"}>{result.technical.passed ? "通过" : "不通过"}</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{result.technical.score.toFixed(1)}</p>
            <ScoreBar value={result.technical.score} tone={result.technical.passed ? "teal" : "red"} className="mt-3" />
          </div>
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <th className="sticky left-0 z-10 min-w-56 bg-slate-50 px-4 py-3 font-medium">技术要求</th>
                <th className="min-w-40 px-4 py-3 font-medium">目标值</th>
                {results.map((result) => <th key={result.supplierId} className="min-w-36 px-4 py-3 font-medium">{result.supplierName}</th>)}
                <th className="min-w-20 px-4 py-3 font-medium">要求</th>
              </tr>
            </thead>
            <tbody>
              {dataset.requirements.map((requirement, index) => (
                <tr key={requirement.key} className="border-b border-slate-100 last:border-0">
                  <td className="sticky left-0 z-10 bg-white px-4 py-4">
                    <p className="font-medium text-slate-900">{requirement.labelZh}</p>
                    <p className="mt-1 text-xs text-slate-500">{requirement.labelEn} · 权重 {requirement.weight}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {requirement.direction === "higher" && "≥ "}{requirement.direction === "lower" && "≤ "}{displayValue(requirement.target, requirement.unit)}
                  </td>
                  {results.map((result) => {
                    const row = result.technical.rows[index];
                    return (
                      <td key={result.supplierId} className="px-4 py-4">
                        <p className={row?.passed ? "text-slate-800" : "font-medium text-red-700"}>{displayValue(row?.value ?? "", requirement.unit)}</p>
                        <ScoreBar className="mt-2 max-w-24" value={row?.score ?? 0} tone={row?.passed ? "teal" : "red"} />
                      </td>
                    );
                  })}
                  <td className="px-4 py-4"><Badge tone={requirement.mandatory ? "warning" : "neutral"}>{requirement.mandatory ? "硬性" : "加权"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
