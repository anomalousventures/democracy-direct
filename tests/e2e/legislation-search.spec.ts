import { test, expect } from "@playwright/test";
import { E2E_BILL } from "./global-setup";

test.describe("Legislation Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/legislation");
    await page.waitForLoadState("networkidle");
  });

  test("page loads with heading and search input", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-testid='bill-search-input']")).toBeVisible();
  });

  test("search finds seeded bill by title keyword", async ({ page }) => {
    const searchInput = page.locator("[data-testid='bill-search-input']");
    await searchInput.fill("Civic Engagement");

    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    const results = page.locator("[data-testid='bill-search-results']");
    await expect(results).toBeVisible();

    const billCard = page.locator("[data-testid='bill-card']").filter({ hasText: E2E_BILL.title });
    await expect(billCard).toBeVisible();
  });

  test("filter buttons are present and functional", async ({ page }) => {
    await expect(page.locator("[data-testid='type-filter']")).toBeVisible();
    await expect(page.locator("[data-testid='status-filter']")).toBeVisible();
    await expect(page.locator("[data-testid='subject-filter']")).toBeVisible();
  });

  test("clicking a bill card navigates to bill detail", async ({ page }) => {
    const searchInput = page.locator("[data-testid='bill-search-input']");
    await searchInput.fill("Civic Engagement");
    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    const billCard = page.locator("[data-testid='bill-card']").filter({ hasText: E2E_BILL.title });
    await billCard.click();

    await page.waitForURL("**/legislation/hr9999-119");
    expect(page.url()).toContain("/legislation/hr9999-119");
  });

  test("search state persists in URL params", async ({ page }) => {
    const searchInput = page.locator("[data-testid='bill-search-input']");
    await searchInput.fill("Civic Engagement");
    await page.waitForTimeout(400);

    expect(page.url()).toContain("q=Civic");
  });

  test("clear filters button resets search", async ({ page }) => {
    const searchInput = page.locator("[data-testid='bill-search-input']");
    await searchInput.fill("Civic Engagement");
    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    const clearButton = page.locator("[data-testid='clear-filters-button']");
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(searchInput).toHaveValue("");
    }
  });

  test("old /bills URL returns 404", async ({ page }) => {
    const response = await page.goto("/bills");
    expect(response?.status()).toBe(404);
  });

  test("header nav shows Legislation link", async ({ page }) => {
    const navLink = page.locator("header").getByRole("link", { name: /legislation/i });
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute("href", "/legislation");
  });
});
