"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Info, Upload, XCircle } from "lucide-react";
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
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Quote Normalization"
        title="报价归一与商务口径"
        description="先统一币种、税费与交付责任，再进入 TCO。教学模拟报价用醒目标签持续标识，避免与厂商正式报价混淆。"
        action={(
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => downloadQuoteTemplate(dataset)}><Download className="size-3.5" />下载模板</Button>
            <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}><Upload className="size-3.5" />{busy ? "解析中" : "导入 XLSX / CSV"}</Button>
            <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </div>
        )}
      />

      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <div className="text-xs leading-5 text-amber-800">
          <strong>数据声明：</strong>以下报价、故障率、停机损失和部分参数均为教学模拟值；真实参数来自公开产品资料，但采购前仍应使用正式 RFQ、规格书和法务条款复核。导入数据仅保存在当前浏览器。
        </div>
      </Card>

      {message && <Card className="border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</Card>}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-800"><XCircle className="size-4" />导入存在 {errors.length} 个问题</div>
          <div className="mt-3 max-h-48 space-y-1 overflow-auto">
            {errors.map((error, index) => <p key={`${error.row}-${error.field}-${index}`} className="text-xs text-red-700">第 {error.row} 行 · {error.field}：{error.message}</p>)}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {dataset.quotes.map((quote) => {
          const supplier = dataset.suppliers.find((candidate) => candidate.id === quote.supplierId);
          const model = dataset.models.find((candidate) => candidate.id === quote.modelId);
          const normalizedUnit = quote.unitPrice * quote.fxToCny * (quote.taxInclusive ? 1 : 1 + quote.vatRate);
          return (
            <Card key={quote.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{supplier?.nameZh}</h3>
                    <Badge tone="warning">模拟报价</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{model?.brand} {model?.model} · {quote.quoteDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">含税单价（折算）</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatCny(normalizedUnit)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                {[
                  ["原始报价", `${quote.unitPrice.toLocaleString()} ${quote.currency}`],
                  ["汇率快照", quote.currency === "CNY" ? "1.0000" : quote.fxToCny.toFixed(4)],
                  ["贸易条款", quote.incoterm],
                  ["税费口径", quote.taxInclusive ? "含税" : `未税 / ${(quote.vatRate * 100).toFixed(0)}%`],
                  ["交期", `${quote.leadTimeWeeks} 周`],
                  ["MOQ", "1 台"],
                  ["付款", "30 / 70"],
                  ["质保", `${quote.warrantyYears} 年`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-3">
                    <p className="text-[11px] text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 p-5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">报价说明：</span>{quote.note}</p>
                <p><span className="font-medium text-slate-700">服务：</span>现场响应 {quote.onSiteResponseHours} h · 交付稳定性 {quote.deliveryStabilityPct}% · {quote.localService ? "本地服务支持" : "依赖区域服务商"}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <FileSpreadsheet className="size-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">报价归一字段</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">供应商</th>
                <th className="px-4 py-3 font-medium">年度维护</th>
                <th className="px-4 py-3 font-medium">首批备件</th>
                <th className="px-4 py-3 font-medium">年度服务合同</th>
                <th className="px-4 py-3 font-medium">运费 + 关税</th>
                <th className="px-4 py-3 font-medium">安装调试</th>
                <th className="px-4 py-3 font-medium">残值率</th>
                <th className="px-4 py-3 font-medium">故障率 / 台/年</th>
                <th className="px-4 py-3 font-medium">故障停机</th>
              </tr>
            </thead>
            <tbody>
              {dataset.quotes.map((quote) => {
                const supplier = dataset.suppliers.find((candidate) => candidate.id === quote.supplierId);
                return (
                  <tr key={quote.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{supplier?.nameZh}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCny(quote.annualServiceCostCny)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCny(quote.sparePartsCny)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCny(quote.serviceContractCny)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCny(quote.freightCny + quote.dutyCny)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCny(quote.installationCny)}</td>
                    <td className="px-4 py-3 text-slate-600">{(quote.residualRate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-slate-600">{quote.expectedFailuresPerYear.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">{quote.downtimeHoursPerFailure} h</td>
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
