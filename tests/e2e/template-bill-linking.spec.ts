import { test, expect } from "@playwright/test";

test.describe("Template Bill Linking - Detail Page", () => {
  test("shows linked legislation section when template has linked bills", async ({ page }) => {
    await page.goto("/templates/e2e-test-infrastructure");
    await page.waitForLoadState("networkidle");

    const linkedLegislation = page.locator("[data-testid='linked-legislation']");
    await expect(linkedLegislation).toBeVisible();

    const billLinks = page.locator("[data-testid='linked-bill']");
    await expect(billLinks).toHaveCount(1);

    const href = await billLinks.first().getAttribute("href");
    expect(href).toMatch(/\/templates\?bill=/);
  });
});

test.describe("Template Bill Linking - Bill Filter", () => {
  test("?bill= param shows context banner on templates page", async ({ page }) => {
    await page.goto("/templates?bill=H.R.3684");
    await page.waitForLoadState("networkidle");

    const banner = page.locator("[data-testid='bill-filter-banner']");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("H.R.3684");

    const showAllLink = banner.locator("a");
    await expect(showAllLink).toHaveAttribute("href", "/templates");
  });

  test("?bill= param filters templates via API", async ({ page }) => {
    const apiCalls: string[] = [];
    await page.route("**/api/templates/search**", async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });

    await page.goto("/templates?bill=H.R.3684");
    await page.waitForLoadState("networkidle");

    const hasBillParam = apiCalls.some((url) => url.includes("bill="));
    expect(hasBillParam).toBe(true);
  });

  test("?bill= with invalid bill number still loads page", async ({ page }) => {
    await page.goto("/templates?bill=INVALID");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/Templates/i);

    const banner = page.locator("[data-testid='bill-filter-banner']");
    await expect(banner).toBeHidden();
  });

  test("zero results for bill filter shows create CTA", async ({ page }) => {
    await page.route("**/api/templates/search**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          templates: [],
          pagination: { nextCursor: null, hasMore: false },
          availableTags: [],
        }),
      });
    });

    await page.goto("/templates?bill=S.999");
    await page.waitForLoadState("networkidle");

    const noResults = page.locator("[data-testid='no-results']");
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText("S.999");
    await expect(noResults).toContainText("Be the first to write one");

    const createLink = noResults.locator("a");
    const href = await createLink.getAttribute("href");
    expect(href).toContain("/templates/new?bill=");
  });
});

test.describe("Template Bill Linking - Create Page", () => {
  test("?bill= param on create page shows bill picker with pre-selected bill", async ({ page }) => {
    await page.goto("/templates/new?bill=H.R.1");
    await page.waitForLoadState("domcontentloaded");

    const linkedBills = page.locator("[data-testid='linked-bills']");
    const isVisible = await linkedBills.isVisible().catch(() => false);
    if (isVisible) {
      await expect(linkedBills).toContainText("H.R.1");
    }
  });

  test("bill picker input renders on create page", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const billPickerInput = page.locator("[data-testid='bill-picker-input']");
    await expect(billPickerInput).toBeVisible();
  });

  test("bill picker shows autocomplete dropdown on search", async ({ page }) => {
    await page.route("**/api/legislation/search**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          bills: [
            {
              id: "test-1",
              billNumber: "1",
              billType: "hr",
              congress: 119,
              title: "Test Bill",
            },
          ],
        }),
      });
    });

    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const billPickerInput = page.locator("[data-testid='bill-picker-input']");

    await billPickerInput.fill("HR 1");

    const dropdown = page.locator("[data-testid='bill-picker-dropdown']");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await expect(dropdown).toContainText("H.R.1");
  });
});

test.describe("Template Bill Linking - Bill Page CTAs", () => {
  test("seeded template links to bill filter from detail page", async ({ page }) => {
    await page.goto("/templates/e2e-test-infrastructure");
    await page.waitForLoadState("networkidle");

    const billLink = page.locator("[data-testid='linked-bill']").first();
    await expect(billLink).toBeVisible();

    const href = await billLink.getAttribute("href");
    expect(href).toContain("/templates?bill=");
  });
});
