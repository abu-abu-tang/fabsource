# FabSource Design System

## Product context
- Product: explainable sourcing comparison for CVD dry vacuum pumps in a 12-inch wafer fab.
- Primary users: equipment procurement, category managers, technical buyers, quality and sourcing reviewers.
- Primary job: compare technical compliance, five-year TCO, delivery service, reliability, and supply risk before recommending a supplier.
- Success posture: evidence-first, calm, auditable, and quick to scan under real procurement review conditions.

## Visual direction
- Mode: operate, not persuade.
- Character: clean enterprise workspace with generous whitespace, quiet borders, and strong numerical hierarchy.
- Palette: white surfaces, `#f6f7f7` page background, near-black text, slate borders, a single teal accent.
- Avoid: gradients, glass effects, decorative blur, heavy shadows, colored icon tiles, section-number ornament, and more than one accent color.
- Typography: one sans family, no more than four sizes; body text is 14-16px and never below 12px.
- Layout: one primary content column, optional desktop sidebar, tables and unframed sections preferred over nested cards.
- Icons: only when they clarify an action or state; never use icons as decoration.
- Copy: remove eyebrow labels and explanatory filler; keep units, assumptions, source notes, and decision caveats.
- Motion: one restrained transition for state changes only.

## Core screens
- Overview: project premise, winner, TCO, cheapest option, hard-gate count, ranking, key judgment, assumptions.
- Requirements: hard gates, weighted specs, supplier compliance matrix.
- Quotes: import controls, normalized commercial comparison, simulated-data disclosure.
- Decision: presets, editable assumptions, five-year TCO breakdown, radar profile, ranking table, sensitivity, calculation trace.
- Recommendation: winner, runner-up, rationale, negotiation points, risk questions, optional AI analysis.
- Sources: source index, evidence boundaries, audit checklist.

## Invariants
- Preserve all deterministic calculations, hard-gate behavior, import/export, local persistence, and BYOK AI boundaries.
- Never alter factual product copy, supplier names, source links, units, or decision criteria during visual refinement.
- Every monetary quote remains visibly marked as simulated.
- Responsive layouts must preserve the primary task without horizontal page overflow.
