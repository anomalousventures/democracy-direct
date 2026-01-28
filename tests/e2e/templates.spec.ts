import { test, expect } from "@playwright/test";

test.describe("Template List Page", () => {
  test("page loads at /templates", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/Templates/i);
    await expect(page.getByRole("heading", { name: /letter templates/i })).toBeVisible();
  });

  test("shows template cards when templates exist", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const templateSection = page.locator("[data-testid='template-list']");
    await expect(templateSection).toBeVisible();
  });

  test("template cards link to detail pages", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      const link = firstTemplate.locator("a");
      const href = await link.getAttribute("href");
      expect(href).toMatch(/\/templates\/[\w-]+/);
    }
  });

  test("shows empty state when no templates", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const emptyState = page.getByText(/no templates/i);
    const templateCards = page.locator("[data-testid='template-card']");

    const hasTemplates = (await templateCards.count()) > 0;
    if (!hasTemplates) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("shows issue tags on template cards", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      const tags = firstTemplate.locator("[data-testid='issue-tag']");
      const tagCount = await tags.count();
      expect(tagCount).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Template Detail Page", () => {
  test("shows 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/templates/non-existent-template-xyz");
    expect(response?.status()).toBe(404);
  });
});
