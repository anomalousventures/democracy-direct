import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and render homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Democracy Direct/);
  });

  test("should display main heading", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Your Voice|Representatives/);
  });
});
