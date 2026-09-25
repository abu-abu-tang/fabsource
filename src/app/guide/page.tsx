import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = {
  title: "FabSource 新手教程",
  description: "从零理解晶圆厂干式真空泵采购、TCO、供应商评分和 FabSource 页面。",
};

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  return "";
}

function headingId(value: ReactNode) {
  return textFromChildren(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export default async function GuidePage() {
  const guidePath = path.join(process.cwd(), "docs", "NEW_USER_GUIDE_CN.md");
  const markdown = await fs.readFile(guidePath, "utf8");
  const toc = Array.from(markdown.matchAll(/^## (.+)$/gm), (match) => ({
    title: match[1],
    id: headingId(match[1]),
  }));

  return (
    <div className="min-h-screen bg-[#f6f7f7] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-[-0.02em] text-slate-950">FabSource</span>
            <span className="text-sm text-slate-500">新手教程</span>
          </Link>
          <Link href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950">
            返回工作台
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-12">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 border-l border-slate-200 pl-5" aria-label="教程目录">
            <p className="text-sm font-medium text-slate-950">教程目录</p>
            <div className="mt-4 space-y-3">
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="block text-sm leading-5 text-slate-500 transition-colors hover:text-teal-800">
                  {item.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">{children}</h1>,
              h2: ({ children }) => <h2 id={headingId(children)} className="mt-14 scroll-mt-8 border-t border-slate-200 pt-8 text-2xl font-semibold tracking-[-0.02em] text-slate-950">{children}</h2>,
              h3: ({ children }) => <h3 id={headingId(children)} className="mt-8 scroll-mt-8 text-lg font-semibold text-slate-950">{children}</h3>,
              p: ({ children }) => <p className="mt-4 text-base leading-7 text-slate-700">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
              ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-700">{children}</ul>,
              ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-slate-700">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
              blockquote: ({ children }) => <blockquote className="mt-6 border-l-2 border-teal-700 bg-white px-5 py-3 text-slate-700">{children}</blockquote>,
              a: ({ href, children }) => <a href={href} className="font-medium text-teal-800 underline decoration-teal-300 underline-offset-4 hover:decoration-teal-700">{children}</a>,
              hr: () => <hr className="my-10 border-slate-200" />,
              pre: ({ children }) => <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-5 text-sm leading-6 text-slate-100">{children}</pre>,
              code: ({ children, className }) => {
                const block = Boolean(className?.includes("language-"));
                return block
                  ? <code className="font-mono">{children}</code>
                  : <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{children}</code>;
              },
              table: ({ children }) => <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[640px] border-collapse text-sm">{children}</table></div>,
              thead: ({ children }) => <thead className="bg-slate-50 text-left text-xs text-slate-500">{children}</thead>,
              th: ({ children }) => <th className="border-b border-slate-200 px-4 py-3 font-medium">{children}</th>,
              td: ({ children }) => <td className="border-b border-slate-100 px-4 py-3 align-top leading-6 text-slate-600">{children}</td>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
