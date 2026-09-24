"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, BookOpenCheck, FileSpreadsheet, LayoutDashboard, ListChecks, RotateCcw,
  Scale, Settings2, ShieldCheck, Sparkles, TableProperties,
} from "lucide-react";
import { OverviewPanel } from "@/components/overview-panel";
import { RequirementsPanel } from "@/components/requirements-panel";
import { QuotesPanel } from "@/components/quotes-panel";
import { DecisionPanel } from "@/components/decision-panel";
import { RecommendationPanel } from "@/components/recommendation-panel";
import { SourcesPanel } from "@/components/sources-panel";
import { Badge, Button } from "@/components/ui";
import { rankSuppliers, fallbackAnalysis } from "@/lib/calculations";
import { exportDecisionPack } from "@/lib/excel";
import { useFabSourceStore, useStoreHydration, type WorkspaceTab } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs: Array<{ id: WorkspaceTab; label: string; short: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "项目总览", short: "总览", icon: LayoutDashboard },
  { id: "requirements", label: "规格门槛", short: "规格", icon: ListChecks },
  { id: "quotes", label: "报价归一", short: "报价", icon: TableProperties },
  { id: "decision", label: "决策分析", short: "决策", icon: BarChart3 },
  { id: "recommendation", label: "推荐与谈判", short: "推荐", icon: Scale },
  { id: "sources", label: "来源与审计", short: "来源", icon: BookOpenCheck },
];

export function FabSourceApp() {
  const hydrated = useStoreHydration();
  const {
    dataset, weights, selectedProfileId, activeTab, auditEvents,
    setActiveTab, reset,
  } = useFabSourceStore();
  const [exporting, setExporting] = useState(false);
  const results = useMemo(() => rankSuppliers(dataset, weights), [dataset, weights]);
  const winner = results.find((result) => result.rank === 1);
  const activeProfile = dataset.profiles.find((profile) => profile.id === selectedProfileId);

  async function handleExport() {
    setExporting(true);
    try {
      await exportDecisionPack(dataset, results, weights, fallbackAnalysis(results));
    } finally {
      setExporting(false);
    }
  }

  function handleReset() {
    if (window.confirm("恢复全部教学模拟数据和默认权重？当前浏览器中的修改将被清除。")) reset();
  }

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">正在载入 FabSource 工作区…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => setActiveTab("overview")}>
            <span className="grid size-9 place-items-center rounded-xl bg-teal-800 text-sm font-black tracking-tight text-white shadow-sm">FS</span>
            <span className="hidden sm:block"><span className="block text-sm font-bold tracking-tight text-slate-950">FabSource</span><span className="block text-[10px] uppercase tracking-[0.15em] text-slate-400">Procurement Decision Cockpit</span></span>
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <Badge tone="warning">教学模拟报价</Badge>
            <Badge tone="teal"><ShieldCheck className="mr-1 size-3" />可审计评分</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw className="size-3.5" /><span className="hidden sm:inline">恢复数据</span></Button>
            <Button size="sm" onClick={handleExport} disabled={exporting}><FileSpreadsheet className="size-3.5" />{exporting ? "生成中" : "导出决策包"}</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[232px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col p-4">
            <div className="rounded-xl bg-slate-950 p-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Active Scenario</p>
              <p className="mt-2 text-sm font-semibold">{dataset.project.name}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{dataset.project.fabProcess} · {dataset.project.category}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11px] text-slate-400">当前首选</span>
                <span className="text-xs font-semibold text-teal-300">{winner?.supplierName ?? "待确认"}</span>
              </div>
            </div>
            <nav className="mt-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      activeTab === tab.id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {tab.id === "recommendation" && winner && <span className="ml-auto size-2 rounded-full bg-emerald-500" />}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><Settings2 className="size-3.5" />当前策略</div>
              <p className="mt-2 text-xs font-semibold text-teal-700">{activeProfile?.name ?? "自定义权重"}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">审计事件 {auditEvents.length} 条</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium", activeTab === tab.id ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600")}><Icon className="size-3.5" />{tab.short}</button>;
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 xl:p-8">
            {activeTab === "overview" && <OverviewPanel dataset={dataset} results={results} weights={weights} onNavigate={setActiveTab} />}
            {activeTab === "requirements" && <RequirementsPanel dataset={dataset} results={results} />}
            {activeTab === "quotes" && <QuotesPanel dataset={dataset} />}
            {activeTab === "decision" && <DecisionPanel dataset={dataset} results={results} weights={weights} />}
            {activeTab === "recommendation" && <RecommendationPanel dataset={dataset} results={results} weights={weights} />}
            {activeTab === "sources" && <SourcesPanel dataset={dataset} />}
          </div>

          <footer className="border-t border-slate-200 px-6 py-5 text-center text-[11px] leading-5 text-slate-400">
            FabSource · 公开参数 + 教学模拟报价 · 不构成厂商报价或采购建议 · <Sparkles className="inline size-3 text-teal-600" /> 确定性评分优先，AI 仅做分析辅助
          </footer>
        </main>
      </div>
    </div>
  );
}
