"use client";

import { ExternalLink, FileCheck2, History, Link2, ShieldCheck } from "lucide-react";
import type { FabSourceDataset } from "@/lib/types";
import { Badge, Card, SectionHeading } from "@/components/ui";

export function SourcesPanel({ dataset }: { dataset: FabSourceDataset }) {
  const official = dataset.sources.filter((source) => source.kind.startsWith("official")).length;
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Evidence & Audit" title="数据来源与审计轨迹" description="项目不是“让 AI 编一个结论”，而是把公开参数、模拟报价、场景假设与系统计算链路分开记录。" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4"><div className="flex items-center gap-3"><Link2 className="size-5 text-teal-700" /><div><p className="text-xs text-slate-500">公开来源</p><p className="text-xl font-semibold">{dataset.sources.length} 条</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><FileCheck2 className="size-5 text-blue-700" /><div><p className="text-xs text-slate-500">官方产品资料</p><p className="text-xl font-semibold">{official} 条</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-amber-700" /><div><p className="text-xs text-slate-500">模拟报价</p><p className="text-xl font-semibold">{dataset.quotes.length} 份</p></div></div></Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/70 p-5">
        <h3 className="text-sm font-semibold text-amber-900">数据使用边界</h3>
        <div className="mt-3 grid gap-3 text-xs leading-5 text-amber-800 md:grid-cols-3">
          <p><strong>公开参数：</strong>品牌、产品族与部分性能区间来自官方产品资料，但演示值仍是跨页面归纳，不应替代正式 datasheet 复核。</p>
          <p><strong>商务数据：</strong>报价、税率、故障率、停机损失和服务条款均为教学模拟，不代表任何厂商的真实报价或承诺。</p>
          <p><strong>决策模型：</strong>评分用于展示可解释方法，不构成采购建议；真实项目需技术、质量、法务和财务共同签核。</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-5"><h3 className="font-semibold text-slate-900">来源索引</h3><p className="mt-1 text-xs text-slate-500">官方链接用于来源展示；公开 Demo 运行时不抓取这些页面。</p></div>
        <div className="divide-y divide-slate-100">
          {dataset.sources.map((source) => (
            <div key={source.id} className="grid gap-4 p-5 lg:grid-cols-[1.4fr_.6fr_.6fr_auto] lg:items-center">
              <div><p className="font-medium text-slate-900">{source.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{source.note}</p></div>
              <div><p className="text-xs text-slate-400">发布方</p><p className="mt-1 text-sm text-slate-700">{source.publisher}</p></div>
              <div><p className="text-xs text-slate-400">访问日期</p><p className="mt-1 text-sm text-slate-700">{source.accessedAt}</p></div>
              <div className="flex items-center gap-2">
                <Badge tone={source.kind === "scenario_assumption" ? "warning" : "info"}>{source.kind.replaceAll("_", " ")}</Badge>
                <a href={source.url} target="_blank" rel="noreferrer" aria-label={`打开 ${source.title}`} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700"><ExternalLink className="size-4" /></a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2"><History className="size-4 text-teal-700" /><h3 className="font-semibold text-slate-900">交付审计清单</h3></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "每项规格要求均包含中英文名、单位、方向、权重和业务理由。",
            "每个报价均区分原始币种、汇率快照、税费口径与 Incoterm。",
            "TCO 每个分项均可在浏览器内重算并导出。",
            "权重变化、假设修改、报价导入与恢复默认均记录审计事件。",
            "AI 只生成摘要和问题，不修改供应商评分或最终排名。",
            "决策包导出时保留模拟数据声明与来源索引。",
          ].map((item) => <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />{item}</div>)}
        </div>
      </Card>
    </div>
  );
}
