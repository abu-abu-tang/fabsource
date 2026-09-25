# Theme

## Token Summary
- Background: `#f6f7f7`
- Surface: `#ffffff`
- Foreground: `#111827`
- Muted: `#667085`
- Border: `#e5e7eb`
- Primary: `#0f766e`
- Avoid: gradients, decorative blur, heavy shadows, excess colors.
- Typography: Aptos / HarmonyOS Sans SC / PingFang SC / Microsoft YaHei.
- Radius: 8-12px; dense data surfaces use 12px.
- Spacing: 4px base with 8/12/16/24/32/40px rhythm.
- Motion: color and 300ms width transitions only.

## Raw Theme Source

### `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #f6f7f7;
  --foreground: #111827;
  --line: #e5e7eb;
  --accent: #0f766e;
  --muted: #667085;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: "Aptos", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-feature-settings: "tnum" 1;
  -webkit-font-smoothing: antialiased;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

input[type="range"] {
  appearance: none;
  height: 3px;
  border-radius: 9999px;
  background: #d8dedd;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  border: 2px solid white;
  border-radius: 9999px;
  background: var(--accent);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  cursor: pointer;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  opacity: 0.35;
}

::selection {
  background: #ccfbf1;
  color: #134e4a;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 9999px;
  background: #cbd5e1;
  background-clip: padding-box;
}

@media print {
  header,
  aside,
  footer,
  button {
    display: none !important;
  }

  body {
    background: white;
  }

  main {
    width: 100% !important;
  }

  .recharts-responsive-container {
    break-inside: avoid;
  }
}

```

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;


```
