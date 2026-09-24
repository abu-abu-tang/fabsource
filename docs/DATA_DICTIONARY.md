# 数据字典

| 类型 | 用途 | 关键字段 |
| --- | --- | --- |
| `SpecRequirement` | 将技术需求转为可计算门槛 | `key`、`direction`、`target`、`mandatory`、`weight` |
| `Supplier` | 供应商主数据 | 中英文名、总部、服务覆盖、视觉标识 |
| `ProductModel` | 可比较型号与公开参数 | 品牌、型号、产品族、`specs`、来源 IDs |
| `CommercialQuote` | 归一后的商务报价 | 币种、汇率、税费、Incoterm、物流、服务、故障率 |
| `TcoAssumption` | 所有场景假设 | 数量、年限、运行小时、电价、停机损失 |
| `WeightSet` | 五维决策权重 | TCO、技术、交付服务、质量可靠性、供应风险 |
| `ScoreProfile` | 策略预设 | 策略名称、说明、固定权重 |
| `TcoBreakdown` | 可解释成本分项 | 采购、物流、安装、能耗、维护、服务、停机、残值 |
| `TechnicalEvaluation` | 技术审查结果 | 硬门槛、总技术分、逐项评分 |
| `ScoreResult` | UI 与导出的统一决策结果 | 资格、排名、总分、分项分、TCO、轨迹 |
| `SourceReference` | 参数和规则来源 | 标题、发布方、URL、访问日期、类型、说明 |
| `AuditEvent` | 用户操作审计 | 权重、假设、导入、恢复默认、AI 分析 |

## 报价导入字段

必填字段包括：

- `supplierId`
- `unitPrice`、`currency`、`fxToCny`
- `incoterm`、`taxInclusive`、`vatRate`
- `freightCny`、`dutyCny`、`installationCny`
- `annualServiceCostCny`、`sparePartsCny`、`serviceContractCny`
- `residualRate`、`warrantyYears`
- `leadTimeWeeks`、`onSiteResponseHours`、`localService`
- `deliveryStabilityPct`、`supplyRiskScore`
- `expectedFailuresPerYear`、`downtimeHoursPerFailure`
- `quoteDate`

`note` 可选。导入时会逐行校验并显示错误行号；不会因为一行错误而静默丢弃整个文件。

## 数据等级

- **公开参数**：厂商、产品族、认证和部分性能区间。
- **场景假设**：数量、年限、能耗、停机和概率。
- **教学模拟报价**：所有商务报价及服务费用。
- **系统计算结果**：TCO、标准分、加权总分和排名。

导出决策包时，四类信息必须保持可区分。
