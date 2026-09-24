export type Currency = "CNY" | "USD" | "EUR";
export type SpecKey =
  | "pumpingSpeed"
  | "ultimatePressure"
  | "inletFlange"
  | "motorPower"
  | "n2Purge"
  | "corrosionCompatible"
  | "mtbf"
  | "serviceInterval"
  | "noise"
  | "footprint"
  | "weight"
  | "semiS2"
  | "ce"
  | "interlock"
  | "localSpares"
  | "serviceNetwork";

export type SpecValue = number | boolean | string;
export type SpecDirection = "higher" | "lower" | "boolean" | "exact";
export type SpecCategory = "process" | "reliability" | "compliance" | "service";
export type ScoreDimension =
  | "tco"
  | "technical"
  | "deliveryService"
  | "qualityReliability"
  | "supplyRisk";

export interface SpecRequirement {
  key: SpecKey;
  labelZh: string;
  labelEn: string;
  unit: string;
  category: SpecCategory;
  direction: SpecDirection;
  target: SpecValue;
  mandatory: boolean;
  weight: number;
  rationale: string;
}

export interface ProductModel {
  id: string;
  supplierId: string;
  brand: string;
  model: string;
  country: string;
  productFamily: string;
  specs: Record<SpecKey, SpecValue>;
  sourceIds: string[];
}

export interface Supplier {
  id: string;
  nameZh: string;
  nameEn: string;
  headquarters: string;
  serviceCoverage: string;
  accent: string;
}

export interface CommercialQuote {
  id: string;
  supplierId: string;
  modelId: string;
  unitPrice: number;
  currency: Currency;
  fxToCny: number;
  incoterm: "EXW" | "FOB" | "CIF" | "DDP";
  taxInclusive: boolean;
  vatRate: number;
  freightCny: number;
  dutyCny: number;
  installationCny: number;
  annualServiceCostCny: number;
  sparePartsCny: number;
  serviceContractCny: number;
  residualRate: number;
  warrantyYears: number;
  leadTimeWeeks: number;
  onSiteResponseHours: number;
  localService: boolean;
  deliveryStabilityPct: number;
  supplyRiskScore: number;
  expectedFailuresPerYear: number;
  downtimeHoursPerFailure: number;
  quoteDate: string;
  note: string;
}

export interface TcoAssumption {
  quantity: number;
  evaluationYears: number;
  annualOperatingHours: number;
  electricityPriceCnyPerKwh: number;
  downtimeCostCnyPerHour: number;
  updatedAt: string;
}

export interface WeightSet {
  tco: number;
  technical: number;
  deliveryService: number;
  qualityReliability: number;
  supplyRisk: number;
}

export interface ScoreProfile {
  id: "balanced" | "cost" | "uptime" | "resilience";
  name: string;
  description: string;
  weights: WeightSet;
}

export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  kind: "official_datasheet" | "official_product_page" | "public_report" | "scenario_assumption";
  note: string;
}

export interface TcoBreakdown {
  purchase: number;
  freightDuty: number;
  installation: number;
  energy: number;
  maintenance: number;
  serviceContract: number;
  downtime: number;
  residualValue: number;
  total: number;
  energyKwh: number;
}

export interface TechnicalEvaluationRow {
  key: SpecKey;
  labelZh: string;
  labelEn: string;
  value: SpecValue;
  requirement: SpecValue;
  unit: string;
  mandatory: boolean;
  passed: boolean;
  score: number;
  weight: number;
  contribution: number;
}

export interface TechnicalEvaluation {
  passed: boolean;
  score: number;
  hardGateFailures: string[];
  rows: TechnicalEvaluationRow[];
}

export interface ScoreResult {
  supplierId: string;
  modelId: string;
  supplierName: string;
  modelName: string;
  eligibility: "eligible" | "disqualified" | "incomplete";
  rank: number | null;
  total: number;
  subscores: Record<ScoreDimension, number>;
  weights: WeightSet;
  tco: TcoBreakdown;
  technical: TechnicalEvaluation;
  hardGateFailures: string[];
  incompleteReasons: string[];
  calculationTrace: string[];
}

export interface AuditEvent {
  id: string;
  at: string;
  type: "weight_change" | "assumption_change" | "quote_import" | "reset" | "ai_analysis";
  description: string;
}

export interface FabSourceDataset {
  version: string;
  project: {
    id: string;
    name: string;
    category: string;
    description: string;
    fabProcess: string;
    buyer: string;
  };
  suppliers: Supplier[];
  models: ProductModel[];
  quotes: CommercialQuote[];
  requirements: SpecRequirement[];
  assumptions: TcoAssumption;
  profiles: ScoreProfile[];
  sources: SourceReference[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface AiAnalysis {
  executiveSummary: string;
  negotiationPoints: string[];
  riskQuestions: string[];
  generatedBy: "fallback" | "model";
}

