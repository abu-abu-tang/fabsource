import { NextResponse } from "next/server";
import { aiRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

function completionUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

export async function POST(request: Request) {
  const parsed = aiRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "AI 配置或分析上下文不完整。" }, { status: 400 });
  }

  const { provider, context } = parsed.data;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(completionUrl(provider.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "你是晶圆厂设备采购分析师。只基于输入数据给出可审计的中文采购摘要，不改变排名，不编造供应商事实。返回 JSON，字段必须是 executiveSummary(string)、negotiationPoints(string[])、riskQuestions(string[])。",
          },
          {
            role: "user",
            content: JSON.stringify(context),
          },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `模型服务返回 ${response.status}`, detail: detail.slice(0, 300) }, { status: 502 });
    }

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "模型未返回可用内容。" }, { status: 502 });
    }

    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const analysis = JSON.parse(cleaned) as { executiveSummary?: unknown; negotiationPoints?: unknown; riskQuestions?: unknown };
    if (typeof analysis.executiveSummary !== "string" || !Array.isArray(analysis.negotiationPoints) || !Array.isArray(analysis.riskQuestions)) {
      return NextResponse.json({ error: "模型响应结构不符合要求。" }, { status: 502 });
    }

    return NextResponse.json({
      executiveSummary: analysis.executiveSummary,
      negotiationPoints: analysis.negotiationPoints.filter((item): item is string => typeof item === "string"),
      riskQuestions: analysis.riskQuestions.filter((item): item is string => typeof item === "string"),
      generatedBy: "model",
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "模型请求超时。" : "无法连接模型服务，请检查 Base URL。";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
