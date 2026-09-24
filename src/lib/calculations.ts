import type {
  AiAnalysis,
  CommercialQuote,
  FabSourceDataset,
  ProductModel,
  ScoreDimension,
  ScoreResult,
  SpecKey,
  SpecRequirement,
  SpecValue,
  TcoAssumption,
  TcoBreakdown,
  TechnicalEvaluation,
  TechnicalEvaluationRow,
  WeightSet,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

export const zeroWeights: WeightSet = {
  tco: 0,
  technical: 0,
  deliveryService: 0,
  qualityReliability: 0,
  supplyRisk: 0,
};

export function normalizeWeights(weights: WeightSet): WeightSet {
  const values = Object.values(weights);
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return { tco: 35, technical: 25, deliveryService: 15, qualityReliability: 15, supplyRisk: 10 };
  return {
    tco: (Math.max(0, weights.tco) / total) * 100,
    technical: (Math.max(0, weights.technical) / total) * 100,
    deliveryService: (Math.max(0, weights.deliveryService) / total) * 100,
    qualityReliability: (Math.max(0, weights.qualityReliability) / total) * 100,
    supplyRisk: (Math.max(0, weights.supplyRisk) / total) * 100,
  };
}

export function normalizeQuote(quote: CommercialQuote) {
  const taxMultiplier = quote.taxInclusive ? 1 : 1 + quote.vatRate;
  const unitPriceCny = quote.unitPrice * quote.fxToCny;
  return {
    unitPriceCny,
    landedUnitPriceCny: unitPriceCny * taxMultiplier,
    freightDutyCny: (quote.freightCny + quote.dutyCny) * taxMultiplier,
    installationCny: quote.installationCny * taxMultiplier,
    taxMultiplier,
    terms: `${quote.incoterm} / ${quote.taxInclusive ? "含税" : "未税"}`,
  };
}

export function calculateTco(
  quote: CommercialQuote,
  model: ProductModel,
  assumptions: TcoAssumption,
): TcoBreakdown {
  const normalized = normalizeQuote(quote);
  const purchase = normalized.landedUnitPriceCny * assumptions.quantity;
  const freightDuty = normalized.freightDutyCny;
  const installation = normalized.installationCny;
  const motorPower = Number(model.specs.motorPower);
  const energyKwh =
    motorPower * assumptions.annualOperatingHours * assumptions.evaluationYears * assumptions.quantity;
  const energy = energyKwh * assumptions.electricityPriceCnyPerKwh;
  const maintenance = quote.annualServiceCostCny * assumptions.evaluationYears;
  const serviceContract = quote.serviceContractCny * assumptions.evaluationYears;
  const downtime =
    quote.expectedFailuresPerYear *
    quote.downtimeHoursPerFailure *
    assumptions.evaluationYears *
    assumptions.quantity *
    assumptions.downtimeCostCnyPerHour;
  const residualValue = purchase * quote.residualRate;
  const total = purchase + freightDuty + installation + energy + maintenance + quote.sparePartsCny + serviceContract + downtime - residualValue;

  return {
    purchase,
    freightDuty,
    installation,
    energy,
    maintenance: maintenance + quote.sparePartsCny,
    serviceContract,
    downtime,
    residualValue,
    total,
    energyKwh,
  };
}

function isSpecNumber(value: SpecValue): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function passesRequirement(value: SpecValue, requirement: SpecRequirement) {
  if (requirement.direction === "boolean") return Boolean(value) === Boolean(requirement.target);
  if (requirement.direction === "exact") return String(value).trim() === String(requirement.target).trim();
  if (!isSpecNumber(value) || !isSpecNumber(requirement.target)) return false;
  return requirement.direction === "higher" ? value >= requirement.target : value <= requirement.target;
}

function scoreRequirement(value: SpecValue, requirement: SpecRequirement) {
  const passed = passesRequirement(value, requirement);
  if (requirement.direction === "boolean" || requirement.direction === "exact") return passed ? 100 : 0;
  if (!isSpecNumber(value) || !isSpecNumber(requirement.target) || value <= 0 || requirement.target <= 0) return 0;

  if (requirement.direction === "higher") {
    if (value < requirement.target) return clamp((value / requirement.target) * 75);
    return clamp(82 + ((value - requirement.target) / requirement.target) * 18);
  }

  if (value > requirement.target) return clamp((requirement.target / value) * 75);
  return clamp(82 + ((requirement.target - value) / requirement.target) * 18);
}

export function evaluateTechnicalFit(
  model: ProductModel,
  requirements: SpecRequirement[],
): TechnicalEvaluation {
  const rows: TechnicalEvaluationRow[] = requirements.map((requirement) => {
    const value = model.specs[requirement.key];
    const passed = passesRequirement(value, requirement);
    const score = scoreRequirement(value, requirement);
    return {
      key: requirement.key,
      labelZh: requirement.labelZh,
      labelEn: requirement.labelEn,
      value,
      requirement: requirement.target,
      unit: requirement.unit,
      mandatory: requirement.mandatory,
      passed,
      score,
      weight: requirement.weight,
      contribution: score * requirement.weight,
    };
  });

  const weightedDenominator = rows.reduce((sum, row) => sum + row.weight, 0);
  const weightedNumerator = rows.reduce((sum, row) => sum + row.contribution, 0);
  const hardGateFailures = rows
    .filter((row) => row.mandatory && !row.passed)
    .map((row) => `${row.labelZh}未满足：${String(row.value)}${row.unit}（要求 ${String(row.requirement)}${row.unit}）`);

  return {
    passed: hardGateFailures.length === 0,
    score: weightedDenominator ? weightedNumerator / weightedDenominator : 0,
    hardGateFailures,
    rows,
  };
}

export function inverseMinMax(value: number, values: number[]) {
  if (values.length === 0) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 100;
  return ((max - value) / (max - min)) * 100;
}

function scoreDelivery(quote: CommercialQuote, serviceNetwork: number) {
  const leadScore = clamp(100 - Math.max(0, quote.leadTimeWeeks - 12) * 4);
  const responseScore = clamp(100 - Math.max(0, quote.onSiteResponseHours - 12) * 2.5);
  return (
    leadScore * 0.25 +
    responseScore * 0.25 +
    clamp(quote.deliveryStabilityPct) * 0.3 +
    clamp(serviceNetwork) * 0.15 +
    (quote.localService ? 5 : 0)
  );
}

function scoreQuality(model: ProductModel, quote: CommercialQuote) {
  const mtbf = Number(model.specs.mtbf);
  const serviceInterval = Number(model.specs.serviceInterval);
  const mtbfScore = clamp(((mtbf - 14000) / 12000) * 100);
  const serviceScore = clamp(((serviceInterval - 7000) / 6000) * 100);
  const failureScore = clamp(100 - quote.expectedFailuresPerYear * 400);
  const warrantyScore = clamp(quote.warrantyYears * 25);
  return mtbfScore * 0.4 + serviceScore * 0.25 + failureScore * 0.2 + warrantyScore * 0.15;
}

function scoreSupplyRisk(model: ProductModel, quote: CommercialQuote) {
  const riskBase = 100 - clamp(quote.supplyRiskScore);
  const localSpares = model.specs.localSpares ? 12 : 0;
  const stability = clamp(quote.deliveryStabilityPct) * 0.25;
  const service = Number(model.specs.serviceNetwork) * 0.25;
  return clamp(riskBase * 0.38 + localSpares + stability + service * 0.4);
}

function validateQuote(quote: CommercialQuote, model: ProductModel | undefined, assumptions: TcoAssumption) {
  const issues: string[] = [];
  if (!model) issues.push("缺少供应商型号与技术参数");
  if (!Number.isFinite(quote.unitPrice) || quote.unitPrice <= 0) issues.push("单价缺失或小于等于 0");
  if (!Number.isFinite(quote.fxToCny) || quote.fxToCny <= 0) issues.push("汇率缺失或小于等于 0");
  if (!Number.isFinite(quote.vatRate) || quote.vatRate < 0) issues.push("税率缺失");
  if (!Number.isFinite(quote.leadTimeWeeks) || quote.leadTimeWeeks <= 0) issues.push("交期缺失");
  if (!quote.incoterm) issues.push("Incoterm 缺失");
  if (assumptions.quantity <= 0 || assumptions.evaluationYears <= 0) issues.push("采购数量或评估年限无效");
  return issues;
}

export function rankSuppliers(dataset: FabSourceDataset, inputWeights: WeightSet): ScoreResult[] {
  const weights = normalizeWeights(inputWeights);
  const preliminary = dataset.quotes.map((quote) => {
    const model = dataset.models.find((candidate) => candidate.id === quote.modelId);
    const supplier = dataset.suppliers.find((candidate) => candidate.id === quote.supplierId);
    const incompleteReasons = validateQuote(quote, model, dataset.assumptions);
    const fallbackModel: ProductModel = model ?? {
      id: quote.modelId,
      supplierId: quote.supplierId,
      brand: supplier?.nameEn ?? "Unknown",
      model: "未匹配型号",
      country: "未知",
      productFamily: "未匹配",
      specs: {} as Record<SpecKey, SpecValue>,
      sourceIds: [],
    };
    const technical = evaluateTechnicalFit(fallbackModel, dataset.requirements);
    const tco = calculateTco(quote, fallbackModel, dataset.assumptions);
    return { quote, model: fallbackModel, supplier, incompleteReasons, technical, tco };
  });

  const eligibleTcOs = preliminary
    .filter((item) => item.incompleteReasons.length === 0 && item.technical.passed)
    .map((item) => item.tco.total);

  const results: ScoreResult[] = preliminary.map((item) => {
    const tcoScore = item.incompleteReasons.length === 0 && item.technical.passed
      ? inverseMinMax(item.tco.total, eligibleTcOs)
      : inverseMinMax(item.tco.total, preliminary.map((candidate) => candidate.tco.total));
    const serviceNetwork = Number(item.model.specs.serviceNetwork ?? 0);
    const subscores: Record<ScoreDimension, number> = {
      tco: tcoScore,
      technical: item.technical.score,
      deliveryService: scoreDelivery(item.quote, serviceNetwork),
      qualityReliability: scoreQuality(item.model, item.quote),
      supplyRisk: scoreSupplyRisk(item.model, item.quote),
    };
    const total = Object.entries(weights).reduce(
      (sum, [dimension, weight]) => sum + subscores[dimension as ScoreDimension] * (weight / 100),
      0,
    );
    const hardGateFailures = item.technical.hardGateFailures;
    const eligibility = item.incompleteReasons.length > 0 ? "incomplete" : hardGateFailures.length > 0 ? "disqualified" : "eligible";

    return {
      supplierId: item.quote.supplierId,
      modelId: item.quote.modelId,
      supplierName: item.supplier?.nameZh ?? "未知供应商",
      modelName: `${item.model.brand} ${item.model.model}`,
      eligibility,
      rank: null,
      total,
      subscores,
      weights,
      tco: item.tco,
      technical: item.technical,
      hardGateFailures,
      incompleteReasons: item.incompleteReasons,
      calculationTrace: [
        `采购价：${item.quote.unitPrice.toLocaleString("zh-CN")} ${item.quote.currency} × 汇率 ${item.quote.fxToCny} × ${item.quote.taxInclusive ? "含税系数 1" : `未税含税化 ${(1 + item.quote.vatRate).toFixed(2)}`}。`,
        `能耗：${Number(item.model.specs.motorPower).toFixed(1)} kW × ${dataset.assumptions.annualOperatingHours} h/年 × ${dataset.assumptions.evaluationYears} 年 × ${dataset.assumptions.quantity} 台。`,
        `停机损失：故障率 ${item.quote.expectedFailuresPerYear}/台/年 × ${item.quote.downtimeHoursPerFailure} h × ¥${dataset.assumptions.downtimeCostCnyPerHour.toLocaleString("zh-CN")}/h。`,
        `总分：TCO ${subscores.tco.toFixed(1)}×${weights.tco.toFixed(1)}% + 技术 ${subscores.technical.toFixed(1)}×${weights.technical.toFixed(1)}% + 交付服务 ${subscores.deliveryService.toFixed(1)}×${weights.deliveryService.toFixed(1)}% + 质量 ${subscores.qualityReliability.toFixed(1)}×${weights.qualityReliability.toFixed(1)}% + 风险韧性 ${subscores.supplyRisk.toFixed(1)}×${weights.supplyRisk.toFixed(1)}%。`,
      ] satisfies string[],
    };
  });

  const eligible = results.filter((result) => result.eligibility === "eligible").sort((a, b) => b.total - a.total);
  eligible.forEach((result, index) => {
    result.rank = index + 1;
  });
  const disqualified = results.filter((result) => result.eligibility === "disqualified").sort((a, b) => b.total - a.total);
  const incomplete = results.filter((result) => result.eligibility === "incomplete").sort((a, b) => b.total - a.total);
  return [...eligible, ...disqualified, ...incomplete];
}

export function fallbackAnalysis(results: ScoreResult[]): AiAnalysis {
  const winner = results.find((result) => result.rank === 1);
  const runnerUp = results.find((result) => result.rank === 2);
  const disqualified = results.filter((result) => result.eligibility === "disqualified");
  if (!winner || !runnerUp) {
    return {
      executiveSummary: "当前数据尚不足以生成有效推荐，请先补齐报价字段或技术参数。",
      negotiationPoints: ["确认报价币种、汇率、含税口径与 Incoterm。", "补齐型号规格书和强制认证证据。"],
      riskQuestions: ["是否存在未披露的安装、备件和服务费用？", "交付延误时的补救与违约责任如何承担？"],
      generatedBy: "fallback",
    };
  }

  const costGap = runnerUp.tco.total - winner.tco.total;
  const winnerQuote = winner;
  const runnerUpQuote = runnerUp;
  return {
    executiveSummary: `按当前权重，${winner.supplierName}（${winner.modelName}）排名第一。其五年 TCO 为 ¥${Math.round(winner.tco.total).toLocaleString("zh-CN")}，相较第二名 ${runnerUp.supplierName} ${costGap >= 0 ? "节省" : "增加"} ¥${Math.abs(Math.round(costGap)).toLocaleString("zh-CN")}。该推荐同时考虑技术符合度、交付服务、可靠性与供应风险，而非最低采购单价。`,
    negotiationPoints: [
      `将 ${winner.supplierName} 的商务目标设为不高于当前 TCO，并优先争取安装调试、年度服务或首批备件折让。`,
      `将质保从 ${winnerQuote.technical.rows.length ? "当前报价条件" : "待确认"}提升至至少 3 年，并明确故障响应起算时间。`,
      `要求 ${runnerUpQuote.supplierName} 冻结报价与汇率有效期，作为双供与议价备选。`,
      "将关键备件清单、价格有效性和本地库存承诺写入附件，而不是只写年度服务框架。",
    ],
    riskQuestions: [
      "MTBF、故障率和能耗数据的测试边界是否与 CVD 工艺工况一致？",
      "现场响应时间是否覆盖 7×24 小时，备件到厂时间是否单独承诺？",
      "SEMI S2、CE 和安全联锁是否提供完整证据包，而非自我声明？",
      disqualified.length ? `${disqualified.map((item) => item.supplierName).join("、")}的硬门槛未满足，是否保留为技术整改或非关键工序备选？` : "是否建立第二供应源以避免项目期单一品牌锁定？",
    ],
    generatedBy: "fallback",
  };
}


