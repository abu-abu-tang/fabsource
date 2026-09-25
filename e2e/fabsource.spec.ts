import { expect, test } from "@playwright/test";

const validCsv = [
  "supplierId,unitPrice,currency,fxToCny,incoterm,taxInclusive,vatRate,freightCny,dutyCny,installationCny,annualServiceCostCny,sparePartsCny,serviceContractCny,residualRate,warrantyYears,leadTimeWeeks,onSiteResponseHours,localService,deliveryStabilityPct,supplyRiskScore,expectedFailuresPerYear,downtimeHoursPerFailure,quoteDate,note",
  "edwards,42000,USD,7.18,CIF,FALSE,0.13,48000,36000,72000,52000,236000,88000,0.08,3,14,24,TRUE,95,22,0.05,10,2026-09-24,Playwright imported quote",
].join("\n");

const invalidCsv = "supplierId,unitPrice\nedwards,not-a-number";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("completes the core sourcing decision flow", async ({ page }) => {
  await expect(page.getByText("FabSource", { exact: true })).toBeVisible();
  await expect(page.getByText("公开参数与模拟报价").first()).toBeVisible();
  await expect(page.getByText("当前供应商排序")).toBeVisible();

  await page.getByRole("button", { name: "决策分析", exact: true }).click();
  await page.getByRole("button", { name: "成本优先" }).click();
  await expect(page.locator("tbody tr").first()).toContainText("荏原制作所");

  await page.getByRole("button", { name: "停机优先" }).click();
  await expect(page.locator("tbody tr").first()).toContainText("爱德华兹真空");

  await page.getByRole("button", { name: "推荐与谈判", exact: true }).click();
  await expect(page.getByText("首选方案 · Rank #1")).toBeVisible();
  await page.getByRole("button", { name: "生成采购摘要" }).click();
  await expect(page.getByText("规则摘要").first()).toBeVisible();
});

test("validates and imports a normalized CSV quote", async ({ page }) => {
  await page.getByRole("button", { name: "报价归一", exact: true }).click();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "valid-quote.csv", mimeType: "text/csv", buffer: Buffer.from(validCsv) });
  await expect(page.getByText("已导入并更新 1 家供应商报价")).toBeVisible();
  await expect(page.getByText("Playwright imported quote")).toBeVisible();
});

test("shows row-level errors for an invalid quote file", async ({ page }) => {
  await page.getByRole("button", { name: "报价归一", exact: true }).click();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "invalid-quote.csv", mimeType: "text/csv", buffer: Buffer.from(invalidCsv) });
  await expect(page.getByText(/导入存在 \d+ 个问题/)).toBeVisible();
  await expect(page.getByText(/unitPrice/).first()).toBeVisible();
});

test("exports an Excel decision pack", async ({ page }) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出决策包" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("FabSource_供应商比选决策包.xlsx");
});


test("keeps desktop and mobile pages free of body-level horizontal overflow", async ({ page }) => {
  const tabs = [
    ["规格门槛", "规格", "技术规格与硬门槛"],
    ["报价归一", "报价", "报价归一与商务口径"],
    ["决策分析", "决策", "多准则决策与权重敏感性"],
    ["推荐与谈判", "推荐", "首选、备选与谈判策略"],
    ["来源与审计", "来源", "数据来源与审计"],
  ] as const;

  for (const [tab, , heading] of tabs) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const desktop = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(desktop.scrollWidth, `${tab} desktop overflow`).toBeLessThanOrEqual(desktop.width + 1);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  for (const [tab, mobileTab, heading] of tabs) {
    await page.getByRole("button", { name: mobileTab, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const mobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(mobile.scrollWidth, `${tab} mobile overflow`).toBeLessThanOrEqual(mobile.width + 1);
  }
});




test("opens the new user guide from the workspace", async ({ page }) => {
  await page.getByRole("link", { name: "新手教程", exact: true }).click();
  await expect(page).toHaveURL(/\/guide$/);
  await expect(page.getByRole("heading", { level: 1, name: "FabSource 新手教程" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "先记住一句话" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "快速术语表" })).toBeVisible();

  const desktop = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(desktop.scrollWidth).toBeLessThanOrEqual(desktop.width + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "FabSource 新手教程" })).toBeVisible();
  const mobile = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.width + 1);

  await page.getByRole("link", { name: "返回工作台", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

