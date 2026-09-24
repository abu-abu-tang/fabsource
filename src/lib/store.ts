"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fabsourceDataset } from "@/data/fabsource";
import type { AuditEvent, CommercialQuote, FabSourceDataset, TcoAssumption, WeightSet } from "@/lib/types";
import { uid } from "@/lib/utils";

export type WorkspaceTab = "overview" | "requirements" | "quotes" | "decision" | "recommendation" | "sources";

interface FabSourceState {
  dataset: FabSourceDataset;
  weights: WeightSet;
  selectedProfileId: string;
  activeTab: WorkspaceTab;
  auditEvents: AuditEvent[];
  setActiveTab: (tab: WorkspaceTab) => void;
  selectProfile: (profileId: string) => void;
  setWeight: (dimension: keyof WeightSet, value: number) => void;
  updateAssumption: <K extends keyof TcoAssumption>(key: K, value: TcoAssumption[K]) => void;
  applyQuoteUpdates: (updates: Partial<CommercialQuote>[]) => void;
  addAudit: (event: Omit<AuditEvent, "id" | "at">) => void;
  reset: () => void;
}

const initialWeights = fabsourceDataset.profiles[0].weights;

export const useFabSourceStore = create<FabSourceState>()(
  persist(
    (set) => ({
      dataset: fabsourceDataset,
      weights: initialWeights,
      selectedProfileId: "balanced",
      activeTab: "overview",
      auditEvents: [{ id: "audit-initial", at: new Date().toISOString(), type: "reset", description: "载入教学模拟数据集" }],
      setActiveTab: (activeTab) => set({ activeTab }),
      selectProfile: (profileId) => set((state) => {
        const profile = state.dataset.profiles.find((candidate) => candidate.id === profileId);
        if (!profile) return state;
        return {
          selectedProfileId: profileId,
          weights: profile.weights,
          auditEvents: [
            { id: uid("audit"), at: new Date().toISOString(), type: "weight_change", description: `切换评分策略：${profile.name}` },
            ...state.auditEvents,
          ],
        };
      }),
      setWeight: (dimension, value) => set((state) => ({
        weights: { ...state.weights, [dimension]: value },
        selectedProfileId: "custom",
        auditEvents: [
          { id: uid("audit"), at: new Date().toISOString(), type: "weight_change", description: `调整 ${dimension} 权重为 ${value}%` },
          ...state.auditEvents,
        ],
      })),
      updateAssumption: (key, value) => set((state) => ({
        dataset: { ...state.dataset, assumptions: { ...state.dataset.assumptions, [key]: value, updatedAt: new Date().toISOString().slice(0, 10) } },
        auditEvents: [
          { id: uid("audit"), at: new Date().toISOString(), type: "assumption_change", description: `更新假设：${key} = ${String(value)}` },
          ...state.auditEvents,
        ],
      })),
      applyQuoteUpdates: (updates) => set((state) => {
        const quotes = state.dataset.quotes.map((quote) => {
          const update = updates.find((candidate) => candidate.supplierId === quote.supplierId);
          return update ? { ...quote, ...update } : quote;
        });
        return {
          dataset: { ...state.dataset, quotes },
          auditEvents: [
            { id: uid("audit"), at: new Date().toISOString(), type: "quote_import", description: `导入并更新 ${updates.length} 家供应商报价` },
            ...state.auditEvents,
          ],
        };
      }),
      addAudit: (event) => set((state) => ({ auditEvents: [{ ...event, id: uid("audit"), at: new Date().toISOString() }, ...state.auditEvents] })),
      reset: () => set({
        dataset: structuredClone(fabsourceDataset),
        weights: initialWeights,
        selectedProfileId: "balanced",
        activeTab: "overview",
        auditEvents: [{ id: uid("audit"), at: new Date().toISOString(), type: "reset", description: "恢复教学模拟数据与默认权重" }],
      }),
    }),
    {
      name: "fabsource-workspace-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ dataset: state.dataset, weights: state.weights, selectedProfileId: state.selectedProfileId, auditEvents: state.auditEvents }),
    },
  ),
);

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- persist needs one client-only pass before reading localStorage.
  useEffect(() => setHydrated(true), []);
  return hydrated;
}


