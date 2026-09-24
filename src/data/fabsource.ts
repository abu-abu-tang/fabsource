import type { FabSourceDataset, ScoreProfile, SpecRequirement } from "@/lib/types";

const requirements: SpecRequirement[] = [
  { key: "pumpingSpeed", labelZh: "N₂ 抽速", labelEn: "Pumping speed (N₂)", unit: "m³/h", category: "process", direction: "higher", target: 600, mandatory: true, weight: 14, rationale: "覆盖 CVD 腔体抽气与负载气体吞吐，低于门槛会限制工艺窗口。" },
  { key: "ultimatePressure", labelZh: "极限压力", labelEn: "Ultimate pressure", unit: "Pa", category: "process", direction: "lower", target: 1, mandatory: true, weight: 10, rationale: "影响基础真空建立速度与漏率诊断能力。" },
  { key: "inletFlange", labelZh: "进气法兰", labelEn: "Inlet flange", unit: "", category: "process", direction: "exact", target: "ISO-K 100", mandatory: true, weight: 5, rationale: "必须与既有 CVD 机台真空管路兼容，避免改造接口。" },
  { key: "motorPower", labelZh: "额定功率", labelEn: "Motor power", unit: "kW", category: "process", direction: "lower", target: 6.5, mandatory: true, weight: 8, rationale: "功率直接进入五年能耗成本，同时影响厂务负荷。" },
  { key: "n2Purge", labelZh: "N₂ 吹扫流量", labelEn: "N₂ purge flow", unit: "sccm", category: "process", direction: "lower", target: 60, mandatory: false, weight: 5, rationale: "兼顾腐蚀性工艺气体稀释效果与氮气消耗量。" },
  { key: "corrosionCompatible", labelZh: "腐蚀气体兼容", labelEn: "Corrosive gas compatible", unit: "", category: "process", direction: "boolean", target: true, mandatory: true, weight: 12, rationale: "CVD 清洗与副产物场景要求泵体材料、密封和吹扫策略适配。" },
  { key: "mtbf", labelZh: "平均无故障时间", labelEn: "MTBF", unit: "h", category: "reliability", direction: "higher", target: 18000, mandatory: false, weight: 10, rationale: "降低非计划停机概率，是晶圆厂与通用采购的关键差异。" },
  { key: "serviceInterval", labelZh: "维护间隔", labelEn: "Service interval", unit: "h", category: "reliability", direction: "higher", target: 8000, mandatory: false, weight: 8, rationale: "维护间隔越长，越有利于减少腔体降载与人力占用。" },
  { key: "noise", labelZh: "噪声", labelEn: "Noise level", unit: "dB(A)", category: "reliability", direction: "lower", target: 78, mandatory: false, weight: 5, rationale: "影响 sub-fab 工作环境与厂务验收。" },
  { key: "footprint", labelZh: "占地面积", labelEn: "Footprint", unit: "m²", category: "reliability", direction: "lower", target: 1.4, mandatory: false, weight: 4, rationale: "sub-fab 空间有限，影响机台布局和检修通道。" },
  { key: "weight", labelZh: "设备重量", labelEn: "Weight", unit: "kg", category: "reliability", direction: "lower", target: 420, mandatory: false, weight: 3, rationale: "影响搬运、基础和现场安装成本。" },
  { key: "semiS2", labelZh: "SEMI S2 安全认证", labelEn: "SEMI S2", unit: "", category: "compliance", direction: "boolean", target: true, mandatory: true, weight: 6, rationale: "晶圆厂设备安全审查的硬性合规要求。" },
  { key: "ce", labelZh: "CE 合规", labelEn: "CE compliance", unit: "", category: "compliance", direction: "boolean", target: true, mandatory: true, weight: 4, rationale: "涉及电气、机械与 EMC 的出口与项目验收要求。" },
  { key: "interlock", labelZh: "安全联锁接口", labelEn: "Safety interlock", unit: "", category: "compliance", direction: "boolean", target: true, mandatory: true, weight: 3, rationale: "需接入厂务安全链路并支持异常停机。" },
  { key: "localSpares", labelZh: "本地备件支持", labelEn: "Local critical spares", unit: "", category: "service", direction: "boolean", target: true, mandatory: false, weight: 8, rationale: "缩短故障恢复时间，是备件策略的重要前提。" },
  { key: "serviceNetwork", labelZh: "中国服务网络评分", labelEn: "China service score", unit: "分", category: "service", direction: "higher", target: 70, mandatory: false, weight: 5, rationale: "综合现场工程师覆盖、服务响应和区域备件仓能力。" },
];

const profiles: ScoreProfile[] = [
  { id: "balanced", name: "综合平衡", description: "兼顾成本、技术、交付、质量和供应韧性的默认策略。", weights: { tco: 35, technical: 25, deliveryService: 15, qualityReliability: 15, supplyRisk: 10 } },
  { id: "cost", name: "成本优先", description: "适用于预算强约束及技术方案已充分验证的场景。", weights: { tco: 50, technical: 20, deliveryService: 10, qualityReliability: 10, supplyRisk: 10 } },
  { id: "uptime", name: "停机优先", description: "适用于关键腔体、低冗余或停机损失极高的场景。", weights: { tco: 10, technical: 20, deliveryService: 30, qualityReliability: 30, supplyRisk: 10 } },
  { id: "resilience", name: "本地化/韧性", description: "强调本地服务、备件保障、供应集中度和长期连续性。", weights: { tco: 25, technical: 25, deliveryService: 15, qualityReliability: 15, supplyRisk: 20 } },
];

export const fabsourceDataset: FabSourceDataset = {
  version: "2026.09",
  project: {
    id: "cvd-dry-pump-2026",
    name: "CVD 干式真空泵批量寻源",
    category: "设备/关键备件",
    description: "为 12 英寸晶圆厂 CVD 产线补充 6 台干式真空泵，比较五年总拥有成本与供应连续性。",
    fabProcess: "CVD / Sub-fab",
    buyer: "晶圆制造厂设备采购",
  },
  suppliers: [
    { id: "edwards", nameZh: "爱德华兹真空", nameEn: "Edwards Vacuum", headquarters: "英国", serviceCoverage: "中国多区域服务团队与备件仓", accent: "#0f766e" },
    { id: "ebara", nameZh: "荏原制作所", nameEn: "Ebara Corporation", headquarters: "日本", serviceCoverage: "华东、华南与华北现场服务", accent: "#0369a1" },
    { id: "pfeiffer", nameZh: "普发真空", nameEn: "Pfeiffer Vacuum", headquarters: "德国", serviceCoverage: "区域服务伙伴与保税备件支持", accent: "#7c3aed" },
    { id: "busch", nameZh: "普旭真空", nameEn: "Busch Vacuum", headquarters: "德国", serviceCoverage: "指定服务商覆盖，关键备件交期较长", accent: "#c2410c" },
  ],
  models: [
    {
      id: "edwards-ixh1000", supplierId: "edwards", brand: "Edwards", model: "iXH1000", country: "英国", productFamily: "iXH dry pump",
      specs: { pumpingSpeed: 1020, ultimatePressure: 0.5, inletFlange: "ISO-K 100", motorPower: 5.6, n2Purge: 42, corrosionCompatible: true, mtbf: 24000, serviceInterval: 12000, noise: 72, footprint: 1.22, weight: 390, semiS2: true, ce: true, interlock: true, localSpares: true, serviceNetwork: 94 },
      sourceIds: ["edwards-product", "semi-s2", "scenario-assumptions"],
    },
    {
      id: "ebara-ev-sa20", supplierId: "ebara", brand: "Ebara", model: "EV-SA20", country: "日本", productFamily: "EV dry pump",
      specs: { pumpingSpeed: 1100, ultimatePressure: 0.7, inletFlange: "ISO-K 100", motorPower: 5.9, n2Purge: 48, corrosionCompatible: true, mtbf: 20500, serviceInterval: 10000, noise: 75, footprint: 1.18, weight: 405, semiS2: true, ce: true, interlock: true, localSpares: true, serviceNetwork: 88 },
      sourceIds: ["ebara-product", "semi-s2", "scenario-assumptions"],
    },
    {
      id: "pfeiffer-acp630", supplierId: "pfeiffer", brand: "Pfeiffer Vacuum", model: "ACP 630", country: "德国", productFamily: "ACP multi-stage dry pump",
      specs: { pumpingSpeed: 630, ultimatePressure: 0.6, inletFlange: "ISO-K 100", motorPower: 5.4, n2Purge: 55, corrosionCompatible: true, mtbf: 22000, serviceInterval: 9000, noise: 76, footprint: 1.31, weight: 395, semiS2: true, ce: true, interlock: true, localSpares: true, serviceNetwork: 82 },
      sourceIds: ["pfeiffer-product", "semi-s2", "scenario-assumptions"],
    },
    {
      id: "busch-cobra-ns0600", supplierId: "busch", brand: "Busch", model: "COBRA NS 0600 C", country: "德国", productFamily: "COBRA NS screw vacuum pump",
      specs: { pumpingSpeed: 620, ultimatePressure: 0.8, inletFlange: "ISO-K 100", motorPower: 6.4, n2Purge: 58, corrosionCompatible: true, mtbf: 16500, serviceInterval: 8000, noise: 77, footprint: 1.36, weight: 418, semiS2: false, ce: true, interlock: true, localSpares: false, serviceNetwork: 68 },
      sourceIds: ["busch-product", "semi-s2", "scenario-assumptions"],
    },
  ],
  quotes: [
    { id: "q-edwards", supplierId: "edwards", modelId: "edwards-ixh1000", unitPrice: 41800, currency: "USD", fxToCny: 7.18, incoterm: "CIF", taxInclusive: false, vatRate: 0.13, freightCny: 48000, dutyCny: 36000, installationCny: 72000, annualServiceCostCny: 52000, sparePartsCny: 236000, serviceContractCny: 88000, residualRate: 0.08, warrantyYears: 3, leadTimeWeeks: 14, onSiteResponseHours: 24, localService: true, deliveryStabilityPct: 95, supplyRiskScore: 22, expectedFailuresPerYear: 0.05, downtimeHoursPerFailure: 10, quoteDate: "2026-09-20", note: "教学模拟报价；含 N₂ 吹扫组件与三年质保。" },
    { id: "q-ebara", supplierId: "ebara", modelId: "ebara-ev-sa20", unitPrice: 318000, currency: "CNY", fxToCny: 1, incoterm: "DDP", taxInclusive: true, vatRate: 0.13, freightCny: 0, dutyCny: 0, installationCny: 65000, annualServiceCostCny: 46000, sparePartsCny: 188000, serviceContractCny: 72000, residualRate: 0.07, warrantyYears: 3, leadTimeWeeks: 18, onSiteResponseHours: 36, localService: true, deliveryStabilityPct: 91, supplyRiskScore: 30, expectedFailuresPerYear: 0.08, downtimeHoursPerFailure: 10, quoteDate: "2026-09-20", note: "教学模拟报价；人民币含税，交付地点为无锡工厂。" },
    { id: "q-pfeiffer", supplierId: "pfeiffer", modelId: "pfeiffer-acp630", unitPrice: 39600, currency: "EUR", fxToCny: 7.86, incoterm: "FOB", taxInclusive: false, vatRate: 0.13, freightCny: 52000, dutyCny: 39000, installationCny: 78000, annualServiceCostCny: 59000, sparePartsCny: 226000, serviceContractCny: 92000, residualRate: 0.09, warrantyYears: 2, leadTimeWeeks: 20, onSiteResponseHours: 30, localService: true, deliveryStabilityPct: 89, supplyRiskScore: 34, expectedFailuresPerYear: 0.07, downtimeHoursPerFailure: 10, quoteDate: "2026-09-21", note: "教学模拟报价；欧洲工厂交货，需办理运输与保险。" },
    { id: "q-busch", supplierId: "busch", modelId: "busch-cobra-ns0600", unitPrice: 248000, currency: "CNY", fxToCny: 1, incoterm: "EXW", taxInclusive: false, vatRate: 0.13, freightCny: 36000, dutyCny: 0, installationCny: 58000, annualServiceCostCny: 41000, sparePartsCny: 165000, serviceContractCny: 61000, residualRate: 0.06, warrantyYears: 2, leadTimeWeeks: 28, onSiteResponseHours: 48, localService: false, deliveryStabilityPct: 78, supplyRiskScore: 62, expectedFailuresPerYear: 0.15, downtimeHoursPerFailure: 14, quoteDate: "2026-09-21", note: "教学模拟报价；原厂交货，不含 SEMI S2 证据包。" },
  ],
  requirements,
  assumptions: {
    quantity: 6,
    evaluationYears: 5,
    annualOperatingHours: 7000,
    electricityPriceCnyPerKwh: 0.75,
    downtimeCostCnyPerHour: 20000,
    updatedAt: "2026-09-24",
  },
  profiles,
  sources: [
    { id: "edwards-product", title: "iXH Dry Vacuum Pumps product information", publisher: "Edwards Vacuum", url: "https://www.edwardsvacuum.com/en/products/dry-pumps/ixh", accessedAt: "2026-09-24", kind: "official_product_page", note: "产品系列公开信息；演示中的具体参数为归纳值，采购前应复核正式规格书。" },
    { id: "ebara-product", title: "EV Series Dry Vacuum Pumps", publisher: "Ebara Corporation", url: "https://www.ebara.com/en/products/vacuum-pump/", accessedAt: "2026-09-24", kind: "official_product_page", note: "产品系列公开信息；演示中的具体参数为归纳值，采购前应复核正式规格书。" },
    { id: "pfeiffer-product", title: "ACP Series Dry Compressing Vacuum Pumps", publisher: "Pfeiffer Vacuum", url: "https://www.pfeiffer-vacuum.com/en/products/vacuum-pumps/dry-compressing-vacuum-pumps/acp-series/", accessedAt: "2026-09-24", kind: "official_product_page", note: "产品系列公开信息；演示中的具体参数为归纳值，采购前应复核正式规格书。" },
    { id: "busch-product", title: "COBRA NS Screw Vacuum Pumps", publisher: "Busch Vacuum Solutions", url: "https://www.buschvacuum.com/en/products/vacuum-pumps/cobra/", accessedAt: "2026-09-24", kind: "official_product_page", note: "产品系列公开信息；演示中的具体参数为归纳值，采购前应复核正式规格书。" },
    { id: "semi-s2", title: "SEMI S2 Environmental, Health and Safety Guideline", publisher: "SEMI", url: "https://www.semi.org/en/products-services/standards/standards-s2", accessedAt: "2026-09-24", kind: "official_product_page", note: "用于说明晶圆厂设备安全审查中的 SEMI S2 合规要求。" },
    { id: "scenario-assumptions", title: "FabSource 教学模拟场景假设", publisher: "FabSource Project", url: "https://github.com/", accessedAt: "2026-09-24", kind: "scenario_assumption", note: "所有报价、停机损失和参数归一值均为教学模拟数据，不代表厂商正式报价。" },
  ],
};

