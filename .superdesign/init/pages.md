# Pages

## `/` — FabSource Workspace
Entry: `src/app/page.tsx`
Dependencies:
- `src/components/fabsource-app.tsx`
  - `src/components/ui.tsx`
  - `src/components/overview-panel.tsx`
  - `src/components/requirements-panel.tsx`
  - `src/components/quotes-panel.tsx`
  - `src/components/decision-panel.tsx`
  - `src/components/recommendation-panel.tsx`
  - `src/components/sources-panel.tsx`
  - `src/lib/calculations.ts`
  - `src/lib/excel.ts`
  - `src/lib/store.ts`
  - `src/data/fabsource.ts`
- `src/app/layout.tsx`
  - `src/app/globals.css`

The root workspace has six client-state views. Preserve the existing deterministic calculations, import/export controls, and disclosure of simulated quote data.
