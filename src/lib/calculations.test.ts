import { describe, expect, it } from "vitest";
import { fabsourceDataset } from "@/data/fabsource";
import { calculateTco, evaluateTechnicalFit, inverseMinMax, normalizeWeights, rankSuppliers } from "@/lib/calculations";

describe("normalizeWeights", () => {
  it("normalizes arbitrary positive weights to 100", () => {
    const result = normalizeWeights({ tco: 2, technical: 1, deliveryService: 1, qualityReliability: 1, supplyRisk: 1 });
    expect(Object.values(result).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 8);
    expect(result.tco).toBeCloseTo(33.333333, 5);
  });

  it("falls back to the balanced profile when all weights are zero or negative", () => {
    expect(normalizeWeights({ tco: 0, technical: 0, deliveryService: 0, qualityReliability: 0, supplyRisk: 0 })).toEqual({
      tco: 35,
      technical: 25,
      deliveryService: 15,
      qualityReliability: 15,
      supplyRisk: 10,
    });
  });
});

describe("inverseMinMax", () => {
  it("returns 100 when all candidate values are identical", () => {
    expect(inverseMinMax(10, [10, 10, 10])).toBe(100);
  });

  it("returns zero for the highest cost and 100 for the lowest cost", () => {
    expect(inverseMinMax(300, [100, 200, 300])).toBe(0);
    expect(inverseMinMax(100, [100, 200, 300])).toBe(100);
  });
});

describe("calculateTco", () => {
  it("normalizes tax, currency, energy, maintenance, downtime and residual value", () => {
    const dataset = fabsourceDataset;
    const quote = dataset.quotes.find((item) => item.supplierId === "edwards")!;
    const model = dataset.models.find((item) => item.supplierId === "edwards")!;
    const tco = calculateTco(quote, model, dataset.assumptions);
    expect(tco.purchase).toBeCloseTo(2_034_840.72, 2);
    expect(tco.energy).toBeCloseTo(882_000, 2);
    expect(tco.maintenance).toBeCloseTo(496_000, 2);
    expect(tco.downtime).toBeCloseTo(300_000, 2);
    expect(tco.total).toBeGreaterThan(4_000_000);
  });

  it("does not silently treat a missing purchase quantity as valid", () => {
    const dataset = fabsourceDataset;
    const quote = dataset.quotes[0];
    const model = dataset.models[0];
    const tco = calculateTco(quote, model, { ...dataset.assumptions, quantity: 0 });
    expect(tco.purchase).toBe(0);
    expect(tco.energy).toBe(0);
  });
});

describe("technical hard gates", () => {
  it("passes Edwards requirements", () => {
    const dataset = fabsourceDataset;
    const result = evaluateTechnicalFit(dataset.models[0], dataset.requirements);
    expect(result.passed).toBe(true);
    expect(result.hardGateFailures).toHaveLength(0);
  });

  it("disqualifies Busch because SEMI S2 is missing", () => {
    const dataset = fabsourceDataset;
    const busch = dataset.models.find((item) => item.supplierId === "busch")!;
    const result = evaluateTechnicalFit(busch, dataset.requirements);
    expect(result.passed).toBe(false);
    expect(result.hardGateFailures.join(" ")).toContain("SEMI S2");
  });
});

describe("supplier ranking", () => {
  it("keeps hard-gate failures out of the ranking", () => {
    const results = rankSuppliers(fabsourceDataset, fabsourceDataset.profiles[0].weights);
    const busch = results.find((result) => result.supplierId === "busch")!;
    expect(busch.eligibility).toBe("disqualified");
    expect(busch.rank).toBeNull();
  });

  it("changes the eligible winner between cost-first and uptime-first profiles", () => {
    const cost = rankSuppliers(fabsourceDataset, fabsourceDataset.profiles.find((profile) => profile.id === "cost")!.weights);
    const uptime = rankSuppliers(fabsourceDataset, fabsourceDataset.profiles.find((profile) => profile.id === "uptime")!.weights);
    const costWinner = cost.find((result) => result.rank === 1)?.supplierId;
    const uptimeWinner = uptime.find((result) => result.rank === 1)?.supplierId;
    expect(costWinner).toBeTruthy();
    expect(uptimeWinner).toBeTruthy();
    expect(costWinner).not.toBe(uptimeWinner);
  });

  it("keeps all weighted totals within the 0-100 range", () => {
    const results = rankSuppliers(fabsourceDataset, fabsourceDataset.profiles[0].weights);
    results.forEach((result) => {
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });
});



