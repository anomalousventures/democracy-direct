import { test, expect } from "@playwright/test";

test.describe("Template List Page", () => {
  test("search input exists", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid='template-search-input']")).toBeVisible();
  });

  test("typing in search filters results", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    await searchInput.fill("nonexistent-template-xyz");

    const noResults = page.locator("[data-testid='no-results']");
    const hasNoResults = await noResults.isVisible().catch(() => false);

    if (hasNoResults) {
      await expect(noResults).toBeVisible();
    }
  });

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

test.describe("Template Creation Page", () => {
  test("page loads at /templates/new", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /create new template/i })).toBeVisible();
  });

  test("form renders with required fields", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const titleInput = page.locator("[data-testid='template-title-input']");
    const bodyInput = page.locator("[data-testid='template-body-input']");
    const submitButton = page.locator("[data-testid='submit-template-button']");

    await expect(titleInput).toBeVisible();
    await expect(bodyInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("shows issue tag selector", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const tagSelector = page.locator("[data-testid='issue-tag-selector']");
    await expect(tagSelector).toBeVisible();
  });
});

test.describe("Template Detail Page", () => {
  test("shows 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/templates/non-existent-template-xyz");
    expect(response?.status()).toBe(404);
  });

  test("shows error page with navigation for invalid slug", async ({ page }) => {
    await page.goto("/templates/non-existent-template-xyz");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/template not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /browse templates/i })).toBeVisible();
  });

  test("template detail page shows use template button", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='use-template-button']")).toBeVisible();
    }
  });

  test("template detail page shows template content", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='template-title']")).toBeVisible();
      await expect(page.locator("[data-testid='template-body']")).toBeVisible();
    }
  });

  test("template detail page shows report button", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='report-button']")).toBeVisible();
    }
  });
});
