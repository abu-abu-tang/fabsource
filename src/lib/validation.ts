import { z } from "zod";
import type { CommercialQuote, Currency, ImportError } from "@/lib/types";

const numeric = (field: string) =>
  z.coerce.number({ error: `${field}必须是数字` }).finite(`${field}必须是有效数字`);

export const quoteImportSchema = z.object({
  supplierId: z.string().trim().min(1, "supplierId 不能为空"),
  unitPrice: numeric("unitPrice").positive("unitPrice 必须大于 0"),
  currency: z.enum(["CNY", "USD", "EUR"]),
  fxToCny: numeric("fxToCny").positive("fxToCny 必须大于 0"),
  incoterm: z.enum(["EXW", "FOB", "CIF", "DDP"]),
  taxInclusive: z.union([z.boolean(), z.string(), z.number()]).transform((value) => String(value).toLowerCase() === "true" || value === 1 || value === true),
  vatRate: numeric("vatRate").min(0).max(1),
  freightCny: numeric("freightCny").min(0),
  dutyCny: numeric("dutyCny").min(0),
  installationCny: numeric("installationCny").min(0),
  annualServiceCostCny: numeric("annualServiceCostCny").min(0),
  sparePartsCny: numeric("sparePartsCny").min(0),
  serviceContractCny: numeric("serviceContractCny").min(0),
  residualRate: numeric("residualRate").min(0).max(1),
  warrantyYears: numeric("warrantyYears").min(0),
  leadTimeWeeks: numeric("leadTimeWeeks").positive(),
  onSiteResponseHours: numeric("onSiteResponseHours").positive(),
  localService: z.union([z.boolean(), z.string(), z.number()]).transform((value) => String(value).toLowerCase() === "true" || value === 1 || value === true),
  deliveryStabilityPct: numeric("deliveryStabilityPct").min(0).max(100),
  supplyRiskScore: numeric("supplyRiskScore").min(0).max(100),
  expectedFailuresPerYear: numeric("expectedFailuresPerYear").min(0),
  downtimeHoursPerFailure: numeric("downtimeHoursPerFailure").min(0),
  quoteDate: z.string().trim().min(1, "quoteDate 不能为空"),
  note: z.string().optional().default(""),
});

export const aiRequestSchema = z.object({
  provider: z.object({
    baseUrl: z.string().url(),
    model: z.string().min(1),
    apiKey: z.string().min(8),
  }),
  context: z.object({
    projectName: z.string(),
    weights: z.record(z.string(), z.number()),
    results: z.array(z.object({
      supplier: z.string(),
      model: z.string(),
      rank: z.number().nullable(),
      eligibility: z.string(),
      total: z.number(),
      tco: z.number(),
      hardGateFailures: z.array(z.string()),
    })),
  }),
});

export function validateImportedRows(rows: Record<string, unknown>[], supplierIds: string[]) {
  const valid: Partial<CommercialQuote>[] = [];
  const errors: ImportError[] = [];
  rows.forEach((row, index) => {
    const parsed = quoteImportSchema.safeParse(row);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        errors.push({ row: index + 2, field: String(issue.path[0] ?? "row"), message: issue.message });
      });
      return;
    }
    if (!supplierIds.includes(parsed.data.supplierId)) {
      errors.push({ row: index + 2, field: "supplierId", message: `未找到供应商：${parsed.data.supplierId}` });
      return;
    }
    valid.push({
      ...parsed.data,
      currency: parsed.data.currency as Currency,
      taxInclusive: parsed.data.taxInclusive,
      localService: parsed.data.localService,
    });
  });
  return { valid, errors };
}
