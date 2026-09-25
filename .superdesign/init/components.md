# Shared UI Components

Shared primitives are implemented in a lightweight local component layer with Tailwind CSS. Only these primitives are reused across page-level panels.

### `src/components/ui.tsx`

```tsx
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-teal-800 text-white hover:bg-teal-900",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        variant === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-xl border border-slate-200 bg-white", className)} {...props} />;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "teal"; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
      tone === "neutral" && "bg-slate-100 text-slate-600",
      tone === "success" && "bg-emerald-50 text-emerald-700",
      tone === "warning" && "bg-amber-50 text-amber-700",
      tone === "danger" && "bg-red-50 text-red-700",
      tone === "info" && "bg-blue-50 text-blue-700",
      tone === "teal" && "bg-teal-50 text-teal-700",
      className,
    )}>{children}</span>
  );
}

export function ScoreBar({ value, tone = "teal", className }: { value: number; tone?: "teal" | "amber" | "red" | "blue"; className?: string }) {
  return (
    <div className={cn("h-1 overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          tone === "teal" && "bg-teal-700",
          tone === "amber" && "bg-amber-500",
          tone === "red" && "bg-red-500",
          tone === "blue" && "bg-blue-600",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, note, tone = "slate" }: { label: string; value: ReactNode; note?: string; tone?: "slate" | "teal" | "amber" | "red" }) {
  return (
    <div className="min-w-0 border-t border-slate-200 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={cn(
        "mt-2 truncate text-2xl font-semibold tracking-[-0.02em]",
        tone === "slate" && "text-slate-950",
        tone === "teal" && "text-teal-800",
        tone === "amber" && "text-amber-700",
        tone === "red" && "text-red-700",
      )}>{value}</p>
      {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
    </div>
  );
}

```
