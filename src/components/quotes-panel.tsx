"use client";

import { useRef, useState } from "react";
import type { FabSourceDataset, ImportError } from "@/lib/types";
import { downloadQuoteTemplate, parseQuoteFile } from "@/lib/excel";
import { useFabSourceStore } from "@/lib/store";
import { formatCny } from "@/lib/utils";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";

export function QuotesPanel({ dataset }: { dataset: FabSourceDataset }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const applyQuoteUpdates = useFabSourceStore((state) => state.applyQuoteUpdates);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setErrors([]);
    setMessage("");
    try {
      const result = await parseQuoteFile(file, dataset);
      setErrors(result.errors);
      if (result.valid.length > 0) {
        applyQuoteUpdates(result.valid);
        setMessage(`已导入并更新 ${result.valid.length} 家供应商报价，排名已重新计算。`);
      }
      if (result.valid.length === 0 && result.errors.length === 0) setMessage("文件中没有可导入的数据行。");
    } catch (error) {
      setErrors([{ row: 1, field: "file", message: error instanceof Error ? error.message : "文件解析失败" }]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        title="报价归一与商务口径"
        description="统一币种、税费和交付责任后，再进入五年 TCO 比较。"
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadQuoteTemplate(dataset)}>下载模板</Button>
            <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "解析中…" : "导入 XLSX / CSV"}</Button>
            <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </div>
        )}
      />

      <p className="max-w-4xl text-sm leading-6 text-slate-500">报价、故障率和服务费用为教学模拟数据。导入内容仅保存在当前浏览器。</p>

      {message && <p className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {errors.length > 0 && (
        <Card className="border-red-200 p-5">
          <h2 className="text-base font-semibold text-red-800">导入存在 {errors.length} 个问题</h2>
          <div className="mt-3 max-h-48 space-y-1 overflow-auto">
            {errors.map((error, index) => <p key={`${error.row}-${error.field}-${index}`} className="text-sm text-red-700">第 {error.row} 行 · {error.field}：{error.message}</p>)}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">供应商 / 型号</th>
                <th className="px-5 py-3 font-medium">含税单价</th>
                <th className="px-5 py-3 font-medium">贸易条件</th>
                <th className="px-5 py-3 font-medium">交期 / 质保</th>
                <th className="px-5 py-3 font-medium">服务响应</th>
                <th className="px-5 py-3 font-medium">维护 / 服务</th>
                <th className="px-5 py-3 font-medium">报价说明</th>
              </tr>
            </thead>
            <tbody>
              {dataset.quotes.map((quote) => {
                const supplier = dataset.suppliers.find((candidate) => candidate.id === quote.supplierId);
                const model = dataset.models.find((candidate) => candidate.id === quote.modelId);
                const normalizedUnit = quote.unitPrice * quote.fxToCny * (quote.taxInclusive ? 1 : 1 + quote.vatRate);
                return (
                  <tr key={quote.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="px-5 py-5">
                      <p className="font-medium text-slate-950">{supplier?.nameZh}</p>
                      <p className="mt-1 text-sm text-slate-500">{model?.brand} {model?.model}</p>
                      <Badge className="mt-2" tone="warning">模拟报价</Badge>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-medium text-slate-900">{formatCny(normalizedUnit)}</p>
                      <p className="mt-1 text-sm text-slate-500">{quote.unitPrice.toLocaleString()} {quote.currency}</p>
                    </td>
                    <td className="px-5 py-5 text-slate-700">{quote.incoterm}<br /><span className="text-slate-500">{quote.taxInclusive ? "含税" : `未税 ${(quote.vatRate * 100).toFixed(0)}%`}</span></td>
                    <td className="px-5 py-5 text-slate-700">{quote.leadTimeWeeks} 周<br /><span className="text-slate-500">{quote.warrantyYears} 年质保</span></td>
                    <td className="px-5 py-5 text-slate-700">{quote.onSiteResponseHours} 小时</td>
                    <td className="px-5 py-5 text-slate-700">{formatCny(quote.annualServiceCostCny)}<br /><span className="text-slate-500">{formatCny(quote.serviceContractCny)} 服务合同</span></td>
                    <td className="max-w-72 px-5 py-5 text-slate-500">{quote.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
