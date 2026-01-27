import { test, expect } from "@playwright/test";

test.describe("ZIP Results Page", () => {
  test("shows error for invalid ZIP format (letters)", async ({ page }) => {
    await page.goto("/zip/abc");
    const error = page.getByText(/invalid zip/i);
    await expect(error).toBeVisible();
  });

  test("shows error for too short ZIP", async ({ page }) => {
    await page.goto("/zip/123");
    const error = page.getByText(/invalid zip/i);
    await expect(error).toBeVisible();
  });

  test("displays try again button on error", async ({ page }) => {
    await page.goto("/zip/abc");
    const tryAgainButton = page.getByRole("link", { name: /try again/i });
    await expect(tryAgainButton).toBeVisible();
    await expect(tryAgainButton).toHaveAttribute("href", "/");
  });

  test("page renders for valid ZIP format", async ({ page }) => {
    const response = await page.goto("/zip/90210");
    expect(response?.status()).toBeLessThan(500);
  });

  test("header navigation is present", async ({ page }) => {
    await page.goto("/zip/90210");
    const logo = page.getByRole("link", { name: /democracy direct/i });
    await expect(logo).toBeVisible();
  });

  test("about link in header works", async ({ page }) => {
    await page.goto("/zip/90210");
    const aboutLink = page.locator("header").getByRole("link", { name: /about/i });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute("href", "/about");
  });
});
