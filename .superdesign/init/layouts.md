# Shared Layouts

The app uses a single client-side workspace shell with a desktop sidebar and mobile top tabs.

### `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FabSource | 晶圆厂干式真空泵寻源比选工作台",
  description: "面向半导体设备采购的可解释 TCO、技术门槛与供应商风险决策演示。",
  keywords: ["半导体供应链", "晶圆厂采购", "干式真空泵", "TCO", "供应商比选", "vibe coding"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

```

### `src/app/page.tsx`

```tsx
import { FabSourceApp } from "@/components/fabsource-app";

export default function Home() {
  return <FabSourceApp />;
}

```

### `src/components/fabsource-app.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import { OverviewPanel } from "@/components/overview-panel";
import { RequirementsPanel } from "@/components/requirements-panel";
import { QuotesPanel } from "@/components/quotes-panel";
import { DecisionPanel } from "@/components/decision-panel";
import { RecommendationPanel } from "@/components/recommendation-panel";
import { SourcesPanel } from "@/components/sources-panel";
import { Button } from "@/components/ui";
import { fallbackAnalysis, rankSuppliers } from "@/lib/calculations";
import { exportDecisionPack } from "@/lib/excel";
import { useFabSourceStore, useStoreHydration, type WorkspaceTab } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs: Array<{ id: WorkspaceTab; label: string; short: string }> = [
  { id: "overview", label: "项目总览", short: "总览" },
  { id: "requirements", label: "规格门槛", short: "规格" },
  { id: "quotes", label: "报价归一", short: "报价" },
  { id: "decision", label: "决策分析", short: "决策" },
  { id: "recommendation", label: "推荐与谈判", short: "推荐" },
  { id: "sources", label: "来源与审计", short: "来源" },
];

export function FabSourceApp() {
  const hydrated = useStoreHydration();
  const { dataset, weights, selectedProfileId, activeTab, setActiveTab, reset } = useFabSourceStore();
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
    if (window.confirm("恢复教学模拟数据和默认权重？当前修改将清除。")) reset();
  }

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">正在载入…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <button className="flex items-baseline gap-3 text-left" onClick={() => setActiveTab("overview")}>
            <span className="text-lg font-semibold tracking-[-0.02em] text-slate-950">FabSource</span>
            <span className="hidden text-sm text-slate-500 sm:inline">晶圆厂采购决策</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>恢复数据</Button>
            <Button size="sm" onClick={handleExport} disabled={exporting}>{exporting ? "生成中…" : "导出决策包"}</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[216px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
            <div className="px-3 pb-5">
              <p className="text-base font-medium text-slate-950">{dataset.project.name}</p>
              <p className="mt-1 text-sm text-slate-500">{dataset.project.fabProcess}</p>
            </div>
            <nav className="space-y-1" aria-label="工作区导航">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    activeTab === tab.id ? "bg-slate-100 font-medium text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto border-t border-slate-200 px-3 pt-5 text-sm text-slate-500">
              <p>当前首选</p>
              <p className="mt-1 font-medium text-slate-900">{winner?.supplierName ?? "待确认"}</p>
              <p className="mt-3">策略</p>
              <p className="mt-1 font-medium text-slate-900">{activeProfile?.name ?? "自定义权重"}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[#f6f7f7]">
          <div className="border-b border-slate-200 bg-white px-4 lg:hidden">
            <div className="flex gap-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 border-b-2 py-3 text-sm",
                    activeTab === tab.id ? "border-teal-800 font-medium text-slate-950" : "border-transparent text-slate-500",
                  )}
                >
                  {tab.short}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            {activeTab === "overview" && <OverviewPanel dataset={dataset} results={results} weights={weights} onNavigate={setActiveTab} />}
            {activeTab === "requirements" && <RequirementsPanel dataset={dataset} results={results} />}
            {activeTab === "quotes" && <QuotesPanel dataset={dataset} />}
            {activeTab === "decision" && <DecisionPanel dataset={dataset} results={results} weights={weights} />}
            {activeTab === "recommendation" && <RecommendationPanel dataset={dataset} results={results} weights={weights} />}
            {activeTab === "sources" && <SourcesPanel dataset={dataset} />}
          </div>

          <footer className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-400">
            公开参数与模拟报价，仅用于展示采购决策方法。
          </footer>
        </main>
      </div>
    </div>
  );
}

```
