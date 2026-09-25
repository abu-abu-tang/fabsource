import type { AiAnalysis, WeightSet } from "@/lib/types";

export interface AiProviderSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface AiAnalysisContext {
  projectName: string;
  weights: WeightSet;
  results: Array<{
    supplier: string;
    model: string;
    rank: number | null;
    eligibility: string;
    total: number;
    tco: number;
    hardGateFailures: string[];
  }>;
}

function completionUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

export async function requestDirectAiAnalysis(
  provider: AiProviderSettings,
  context: AiAnalysisContext,
): Promise<AiAnalysis> {
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
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });

  if (!response.ok) throw new Error(`模型服务返回 ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型未返回可用内容。");

  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const analysis = JSON.parse(cleaned) as Partial<AiAnalysis>;
  if (typeof analysis.executiveSummary !== "string" || !Array.isArray(analysis.negotiationPoints) || !Array.isArray(analysis.riskQuestions)) {
    throw new Error("模型响应结构不符合要求。");
  }

  return {
    executiveSummary: analysis.executiveSummary,
    negotiationPoints: analysis.negotiationPoints.filter((item): item is string => typeof item === "string"),
    riskQuestions: analysis.riskQuestions.filter((item): item is string => typeof item === "string"),
    generatedBy: "model",
  };
}

