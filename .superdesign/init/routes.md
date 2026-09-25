# Routes

## `/`
- Entry: `src/app/page.tsx`
- Layout: `src/app/layout.tsx`
- Primary component: `src/components/fabsource-app.tsx`
- Purpose: single-page procurement decision workspace.
- Internal views: overview, requirements, quotes, decision, recommendation, sources.

## `/api/ai/analyze`
- Entry: `src/app/api/ai/analyze/route.ts`
- Method: POST
- Purpose: optional BYOK AI summary; never changes deterministic rankings.

The app has no URL-based subroutes for the six workspace views; navigation is held in client state.
