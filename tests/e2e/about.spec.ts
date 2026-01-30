import { test, expect } from "@playwright/test";

test.describe("About Page", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About.*Democracy Direct/);
  });

  test("contains mission statement", async ({ page }) => {
    await page.goto("/about");
    const content = await page.textContent("main");
    expect(content).toMatch(/mission/i);
  });

  test("contains privacy section", async ({ page }) => {
    await page.goto("/about");
    const privacySection = page.locator("#privacy, h2:has-text('Privacy')");
    await expect(privacySection).toBeVisible();
  });

  test("contains data sources section", async ({ page }) => {
    await page.goto("/about");
    const dataSourcesSection = page.locator("#data-sources, h2:has-text('Data Sources')");
    await expect(dataSourcesSection).toBeVisible();
  });

  test("lists data source links", async ({ page }) => {
    await page.goto("/about");
    const congressLink = page.getByRole("link", {
      name: /congress-legislators/i,
    });
    await expect(congressLink).toBeVisible();
  });

  test("contains roadmap link in content", async ({ page }) => {
    await page.goto("/about");
    const mainContent = page.locator("main");
    const roadmapLink = mainContent.getByRole("link", { name: /roadmap/i });
    await expect(roadmapLink).toBeVisible();
    await expect(roadmapLink).toHaveAttribute("href", "/roadmap");
  });
});
