import { test, expect } from "@playwright/test";

test.describe("Production Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("templates page loads", async ({ page }) => {
    const response = await page.goto("/templates");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("turnstile widget appears in login modal", async ({ page }) => {
    await page.goto("/");
    // Wait for React hydration
    const signInButton = page.getByTestId("sign-in-button");
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    // Turnstile widget container appears in login modal
    await expect(page.getByTestId("turnstile-widget")).toBeVisible({ timeout: 15000 });
  });

  test("zip lookup form is interactive", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toBeVisible();
    await expect(zipInput).toBeEnabled();
  });
});
