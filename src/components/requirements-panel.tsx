"use client";

import { CheckCircle2, Filter, ShieldAlert } from "lucide-react";
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
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Scope & Gates"
        title="技术规格与硬门槛"
        description="硬性要求用于排除不能被采购判断掩盖的合规和技术风险；加权项用于区分通过门槛后的方案质量。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3"><Filter className="size-5 text-teal-700" /><div><p className="text-xs text-slate-500">规格项</p><p className="text-xl font-semibold">{dataset.requirements.length} 项</p></div></div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3"><ShieldAlert className="size-5 text-amber-600" /><div><p className="text-xs text-slate-500">强制性要求</p><p className="text-xl font-semibold">{mandatoryCount} 项</p></div></div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-emerald-600" /><div><p className="text-xs text-slate-500">发现硬门槛问题</p><p className="text-xl font-semibold">{hardFailures.length} 项</p></div></div>
        </Card>
      </div>

      {hardFailures.length > 0 && (
        <Card className="border-red-200 bg-red-50/60 p-4">
          <p className="text-sm font-semibold text-red-800">硬门槛警报</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {hardFailures.map((item) => (
              <div key={`${item.supplier}-${item.failure}`} className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs text-red-700">
                <strong>{item.supplier}</strong> · {item.failure}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {results.map((result) => (
          <Card key={result.supplierId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{result.supplierName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{result.modelName}</p>
              </div>
              <Badge tone={result.eligibility === "eligible" ? "success" : "danger"}>{result.technical.passed ? "PASS" : "FAIL"}</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-950">{result.technical.score.toFixed(1)}</p>
            <ScoreBar value={result.technical.score} tone={result.technical.passed ? "teal" : "red"} className="mt-2" />
            <p className="mt-2 text-xs text-slate-500">技术加权得分 / 100</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <th className="sticky left-0 z-10 min-w-56 bg-slate-50 px-4 py-3 font-medium">技术 / 合规要求</th>
                <th className="min-w-44 px-4 py-3 font-medium">目标值</th>
                {results.map((result) => <th key={result.supplierId} className="min-w-36 px-4 py-3 font-medium">{result.supplierName}</th>)}
                <th className="min-w-20 px-4 py-3 font-medium">性质</th>
              </tr>
            </thead>
            <tbody>
              {dataset.requirements.map((requirement, index) => (
                <tr key={requirement.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3.5 hover:bg-slate-50/60">
                    <p className="font-medium text-slate-900">{requirement.labelZh}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{requirement.labelEn} · 权重 {requirement.weight}</p>
                    <p className="mt-1 max-w-xs text-[11px] leading-4 text-slate-400">{requirement.rationale}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {requirement.direction === "higher" && "≥ "}
                    {requirement.direction === "lower" && "≤ "}
                    {displayValue(requirement.target, requirement.unit)}
                  </td>
                  {results.map((result) => {
                    const row = result.technical.rows[index];
                    return (
                      <td key={result.supplierId} className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={row?.passed ? "text-slate-900" : "font-semibold text-red-600"}>{displayValue(row?.value ?? "", requirement.unit)}</span>
                          <span className={`size-1.5 rounded-full ${row?.passed ? "bg-emerald-500" : "bg-red-500"}`} />
                        </div>
                        <ScoreBar className="mt-2 max-w-24" value={row?.score ?? 0} tone={row?.passed ? "teal" : "red"} />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3.5"><Badge tone={requirement.mandatory ? "warning" : "neutral"}>{requirement.mandatory ? "硬性" : "加权"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
