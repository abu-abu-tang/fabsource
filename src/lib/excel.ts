"use client";

import type { AiAnalysis, CommercialQuote, FabSourceDataset, ImportError, ScoreResult, WeightSet } from "@/lib/types";
import { todayIso } from "@/lib/utils";
import { validateImportedRows } from "@/lib/validation";

const quoteHeaders = [
  "supplierId", "unitPrice", "currency", "fxToCny", "incoterm", "taxInclusive", "vatRate",
  "freightCny", "dutyCny", "installationCny", "annualServiceCostCny", "sparePartsCny",
  "serviceContractCny", "residualRate", "warrantyYears", "leadTimeWeeks", "onSiteResponseHours",
  "localService", "deliveryStabilityPct", "supplyRiskScore", "expectedFailuresPerYear",
  "downtimeHoursPerFailure", "quoteDate", "note",
] as const;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function newWorkbook() {
  const ExcelJS = (await import("exceljs")).default;
  return { ExcelJS, workbook: new ExcelJS.Workbook() };
}

function styleHeader(row: import("exceljs").Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  row.alignment = { vertical: "middle", horizontal: "center" };
}

export async function downloadQuoteTemplate(dataset: FabSourceDataset) {
  const { workbook } = await newWorkbook();
  const sheet = workbook.addWorksheet("Quotes");
  sheet.addRow([...quoteHeaders]);
  styleHeader(sheet.getRow(1));
  dataset.quotes.forEach((quote) => sheet.addRow(quoteHeaders.map((header) => quote[header])));
  sheet.columns = quoteHeaders.map((header) => ({ key: header, width: header === "note" ? 42 : Math.max(15, header.length + 3) }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRow(["FabSource 报价导入模板"]);
  instructions.addRow(["1", "不要修改第一行字段名。supplierId 使用供应商页显示的 ID。"]);
  instructions.addRow(["2", "taxInclusive 与 localService 填写 TRUE/FALSE；vatRate 填 0.13 表示 13%。"]);
  instructions.addRow(["3", "所有报价均为模拟数据；导入数据只保存在当前浏览器。"]);
  instructions.getColumn(1).width = 10;
  instructions.getColumn(2).width = 90;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "FabSource_报价导入模板.xlsx");
}

function cellValue(value: import("exceljs").CellValue): unknown {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("result" in value) return value.result;
    if ("text" in value) return value.text;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  }
  return value;
}

export async function parseQuoteFile(file: File, dataset: FabSourceDataset): Promise<{ valid: Partial<CommercialQuote>[]; errors: ImportError[] }> {
  let rows: Record<string, unknown>[] = [];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const Papa = (await import("papaparse")).default;
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
    rows = parsed.data;
  } else {
    const { workbook } = await newWorkbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { valid: [], errors: [{ row: 1, field: "file", message: "工作簿中没有可读取的工作表" }] };
    const headers = sheet.getRow(1).values as unknown[];
    const names = headers.slice(1).map((value) => String(value ?? "").trim());
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, unknown> = {};
      names.forEach((name, index) => {
        record[name] = cellValue(row.getCell(index + 1).value);
      });
      rows.push(record);
    });
  }
  return validateImportedRows(rows, dataset.suppliers.map((supplier) => supplier.id));
}

export async function exportDecisionPack(
  dataset: FabSourceDataset,
  results: ScoreResult[],
  weights: WeightSet,
  analysis?: AiAnalysis,
) {
  const { workbook } = await newWorkbook();
  const summary = workbook.addWorksheet("Executive_Summary");
  summary.addRows([
    ["FabSource 供应商比选决策包"],
    ["项目", dataset.project.name],
    ["采购场景", dataset.project.description],
    ["生成日期", todayIso()],
    ["数据声明", "技术参数来自公开资料归纳；报价、故障率与停机损失均为教学模拟数据，不构成采购依据。"],
    [],
    ["决策权重", "TCO", "技术", "交付服务", "质量可靠性", "供应风险"],
    ["", weights.tco, weights.technical, weights.deliveryService, weights.qualityReliability, weights.supplyRisk],
    [],
    ["排名", "供应商", "型号", "资格", "总分", "五年TCO", "硬门槛"],
  ]);
  results.forEach((result) => summary.addRow([
    result.rank ?? "不参与", result.supplierName, result.modelName,
    result.eligibility === "eligible" ? "有效" : result.eligibility === "disqualified" ? "硬门槛淘汰" : "数据不完整",
    result.total, result.tco.total, result.hardGateFailures.join("；") || "无",
  ]));
  summary.getColumn(1).width = 16;
  summary.getColumn(2).width = 24;
  summary.getColumn(3).width = 28;
  summary.getColumn(4).width = 18;
  summary.getColumn(5).width = 14;
  summary.getColumn(6).width = 18;
  summary.getColumn(7).width = 46;

  const tco = workbook.addWorksheet("TCO_Breakdown");
  tco.addRow(["供应商", "型号", "采购价", "运费关税", "安装", "能耗", "维护备件", "服务合同", "停机损失", "残值抵扣", "五年TCO"]);
  styleHeader(tco.getRow(1));
  results.forEach((result) => tco.addRow([
    result.supplierName, result.modelName, result.tco.purchase, result.tco.freightDuty,
    result.tco.installation, result.tco.energy, result.tco.maintenance,
    result.tco.serviceContract, result.tco.downtime, -result.tco.residualValue, result.tco.total,
  ]));
  tco.columns.forEach((column) => { column.width = 18; });

  const scorecard = workbook.addWorksheet("Scorecard");
  scorecard.addRow(["排名", "供应商", "资格", "总分", "TCO", "技术", "交付服务", "质量可靠性", "供应风险", "淘汰/缺失原因"]);
  styleHeader(scorecard.getRow(1));
  results.forEach((result) => scorecard.addRow([
    result.rank ?? "不参与", result.supplierName,
    result.eligibility === "eligible" ? "有效" : result.eligibility,
    result.total, result.subscores.tco, result.subscores.technical,
    result.subscores.deliveryService, result.subscores.qualityReliability,
    result.subscores.supplyRisk,
    [...result.hardGateFailures, ...result.incompleteReasons].join("；") || "无",
  ]));
  scorecard.columns.forEach((column) => { column.width = 18; });

  const specs = workbook.addWorksheet("Technical_Matrix");
  specs.addRow(["参数", "要求", "硬性", ...results.map((result) => result.supplierName)]);
  styleHeader(specs.getRow(1));
  dataset.requirements.forEach((requirement, index) => {
    specs.addRow([
      `${requirement.labelZh} / ${requirement.labelEn}`,
      `${String(requirement.target)} ${requirement.unit}`,
      requirement.mandatory ? "是" : "否",
      ...results.map((result) => `${String(result.technical.rows[index]?.value ?? "")} ${requirement.unit} [${result.technical.rows[index]?.passed ? "PASS" : "FAIL"}]`),
    ]);
  });
  specs.columns.forEach((column) => { column.width = 24; });

  const sources = workbook.addWorksheet("Data_Sources");
  sources.addRow(["名称", "发布方", "类型", "访问日期", "链接", "说明"]);
  styleHeader(sources.getRow(1));
  dataset.sources.forEach((source) => sources.addRow([source.title, source.publisher, source.kind, source.accessedAt, source.url, source.note]));
  sources.columns = [{ width: 42 }, { width: 22 }, { width: 22 }, { width: 14 }, { width: 58 }, { width: 64 }];

  if (analysis) {
    const ai = workbook.addWorksheet("Analysis");
    ai.addRow(["采购摘要", analysis.executiveSummary]);
    ai.addRow([]);
    ai.addRow(["谈判要点"]);
    analysis.negotiationPoints.forEach((point) => ai.addRow([point]));
    ai.addRow([]);
    ai.addRow(["风险追问"]);
    analysis.riskQuestions.forEach((point) => ai.addRow([point]));
    ai.getColumn(1).width = 120;
    ai.getColumn(1).alignment = { wrapText: true, vertical: "top" };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "FabSource_供应商比选决策包.xlsx");
}
