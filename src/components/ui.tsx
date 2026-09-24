import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-teal-700 text-white shadow-sm hover:bg-teal-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        variant === "danger" && "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "size-9",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]", className)} {...props} />;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "teal"; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5",
      tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600",
      tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
      tone === "danger" && "border-red-200 bg-red-50 text-red-700",
      tone === "info" && "border-blue-200 bg-blue-50 text-blue-700",
      tone === "teal" && "border-teal-200 bg-teal-50 text-teal-700",
      className,
    )}>{children}</span>
  );
}

export function ScoreBar({ value, tone = "teal", className }: { value: number; tone?: "teal" | "amber" | "red" | "blue"; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "teal" && "bg-teal-600",
          tone === "amber" && "bg-amber-500",
          tone === "red" && "bg-red-500",
          tone === "blue" && "bg-blue-600",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Metric({ label, value, note, tone = "slate" }: { label: string; value: ReactNode; note?: string; tone?: "slate" | "teal" | "amber" | "red" }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn(
        "mt-1 truncate text-xl font-semibold tracking-tight",
        tone === "slate" && "text-slate-950",
        tone === "teal" && "text-teal-700",
        tone === "amber" && "text-amber-700",
        tone === "red" && "text-red-700",
      )}>{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}

