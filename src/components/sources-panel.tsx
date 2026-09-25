"use client";

import type { FabSourceDataset } from "@/lib/types";
import { Badge, SectionHeading } from "@/components/ui";

export function SourcesPanel({ dataset }: { dataset: FabSourceDataset }) {
  const official = dataset.sources.filter((source) => source.kind.startsWith("official")).length;

  return (
    <div className="space-y-8">
      <SectionHeading title="数据来源与审计" description="公开参数、模拟报价、场景假设和系统计算保持明确区分。" />

      <section className="grid gap-6 border-b border-slate-200 pb-6 text-sm sm:grid-cols-3">
        <div><span className="text-slate-500">公开来源</span><p className="mt-1 text-lg font-medium text-slate-950">{dataset.sources.length} 条</p></div>
        <div><span className="text-slate-500">官方产品资料</span><p className="mt-1 text-lg font-medium text-slate-950">{official} 条</p></div>
        <div><span className="text-slate-500">模拟报价</span><p className="mt-1 text-lg font-medium text-slate-950">{dataset.quotes.length} 份</p></div>
      </section>

      <section className="grid gap-5 border-b border-slate-200 pb-8 md:grid-cols-3">
        <div><h2 className="font-medium text-slate-900">公开参数</h2><p className="mt-2 text-sm leading-6 text-slate-500">品牌、产品族和性能区间来自公开资料，演示值需以正式规格书复核。</p></div>
        <div><h2 className="font-medium text-slate-900">商务数据</h2><p className="mt-2 text-sm leading-6 text-slate-500">报价、故障率和服务费用均为教学模拟数据，不代表任何厂商承诺。</p></div>
        <div><h2 className="font-medium text-slate-900">决策模型</h2><p className="mt-2 text-sm leading-6 text-slate-500">评分用于展示方法，不构成采购建议，真实项目需多部门签核。</p></div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">来源索引</h2>
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {dataset.sources.map((source) => (
            <div key={source.id} className="grid gap-4 py-5 lg:grid-cols-[1.4fr_.7fr_.6fr_auto] lg:items-center">
              <div>
                {source.kind === "scenario_assumption"
                  ? <span className="font-medium text-slate-900">{source.title}</span>
                  : <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-teal-700">{source.title}</a>}
                <p className="mt-2 text-sm leading-6 text-slate-500">{source.note}</p>
              </div>
              <div><p className="text-sm text-slate-500">发布方</p><p className="mt-1 text-sm text-slate-700">{source.publisher}</p></div>
              <div><p className="text-sm text-slate-500">访问日期</p><p className="mt-1 text-sm text-slate-700">{source.accessedAt}</p></div>
              <Badge tone={source.kind === "scenario_assumption" ? "warning" : "info"}>{source.kind.replaceAll("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-950">审计清单</h2>
        <div className="mt-4 grid gap-x-10 gap-y-3 md:grid-cols-2">
          {[
            "规格包含中英文名、单位、方向、权重和业务理由。",
            "报价区分币种、汇率快照、税费口径与 Incoterm。",
            "TCO 分项可在浏览器内重算并导出。",
            "权重、假设、导入和恢复默认均记录审计事件。",
            "AI 只生成文字，不修改供应商评分或排名。",
            "决策包保留模拟数据声明和来源索引。",
          ].map((item) => <p key={item} className="border-b border-slate-100 py-3 text-sm text-slate-600">{item}</p>)}
        </div>
      </section>
    </div>
  );
}

