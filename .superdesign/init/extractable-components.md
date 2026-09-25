# Extractable Components

## AppShell
- Source: `src/components/fabsource-app.tsx`
- Category: layout
- Description: header, desktop sidebar, mobile tabs, and content frame.
- Extractable props: activeTab, projectName, winnerName, profileName.
- Hardcoded: desktop/mobile navigation labels and visual styling.

## Button
- Source: `src/components/ui.tsx`
- Category: basic
- Description: primary, secondary, ghost, and danger actions.
- Extractable props: variant, size, disabled.
- Hardcoded: typography, states, colors, radius.

## Card
- Source: `src/components/ui.tsx`
- Category: basic
- Description: bordered content surface used for tables and charts.
- Extractable props: className, children.
- Hardcoded: border, radius, surface color.

## Badge
- Source: `src/components/ui.tsx`
- Category: basic
- Description: compact status label.
- Extractable props: tone, children.
- Hardcoded: typography and semantic colors.

## SectionHeading
- Source: `src/components/ui.tsx`
- Category: basic
- Description: page section heading and optional description/action.
- Extractable props: title, description, action.
- Hardcoded: typography, spacing, border.

## ScoreBar
- Source: `src/components/ui.tsx`
- Category: basic
- Description: compact 0-100 score indicator.
- Extractable props: value, tone.
- Hardcoded: track and fill colors.
