import { test, expect } from "@playwright/test";

test.describe("Campaign Finance on Rep Profile", () => {
  test("finance tab renders without errors", async ({ page }) => {
    await page.goto("/rep/P000622");
    await page.getByRole("tab", { name: /Contact/i }).waitFor({ state: "visible" });

    const financeTab = page.getByRole("tab", { name: /finance/i });
    if (await financeTab.isVisible()) {
      await financeTab.click();
      const tabpanel = page.getByRole("tabpanel");
      await expect(tabpanel).toBeVisible();
    }
  });

  test("section is absent for invalid rep (404 page)", async ({ page }) => {
    await page.goto("/rep/Z999999");
    const financeSection = page.locator("[data-testid='campaign-finance-section']");
    await expect(financeSection).toHaveCount(0);
  });

  test.describe("with finance data", () => {
    test.skip(!process.env.CAMPAIGN_FINANCE_SEEDED, "Requires campaign finance data in database");

    const REP_WITH_DATA = "/rep/S000033";

    test.beforeEach(async ({ page }) => {
      await page.goto(REP_WITH_DATA);
      await page.getByRole("tab", { name: /Contact/i }).waitFor({ state: "visible" });
      const financeTab = page.getByRole("tab", { name: /finance/i });
      await financeTab.click();
    });

    test("campaign finance section is visible", async ({ page }) => {
      const financeSection = page.locator("[data-testid='campaign-finance-section']");
      await expect(financeSection).toBeVisible();
    });

    test("displays total raised with dollar amount", async ({ page }) => {
      await expect(page.getByText("Total Raised")).toBeVisible();

      const financeSection = page.locator("[data-testid='campaign-finance-section']");
      await expect(financeSection.getByText(/\$/)).toBeVisible();
    });

    test("displays PAC and individual funding breakdown", async ({ page }) => {
      const financeSection = page.locator("[data-testid='campaign-finance-section']");
      await expect(financeSection.getByText("PACs")).toBeVisible();
      await expect(financeSection.getByText("Individuals")).toBeVisible();
    });

    test("displays attribution link", async ({ page }) => {
      const financeSection = page.locator("[data-testid='campaign-finance-section']");
      const attribution = financeSection.getByText("Data from FEC.gov");
      await expect(attribution).toBeVisible();
    });

    test("FEC source link has correct href format", async ({ page }) => {
      const financeSection = page.locator("[data-testid='campaign-finance-section']");
      const fecLink = financeSection.locator('a[href*="fec.gov"]');
      await expect(fecLink).toBeVisible();
    });
  });
});
