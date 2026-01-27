import { test, expect } from "@playwright/test";

test.describe("Privacy Policy Page", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy.*Democracy Direct/);
  });

  test("contains data collection section", async ({ page }) => {
    await page.goto("/privacy");
    const content = await page.textContent("main");
    expect(content).toMatch(/collect|data collection/i);
  });

  test("contains data retention section", async ({ page }) => {
    await page.goto("/privacy");
    const content = await page.textContent("main");
    expect(content).toMatch(/retain|retention|store|storage/i);
  });

  test("contains user rights section", async ({ page }) => {
    await page.goto("/privacy");
    const content = await page.textContent("main");
    expect(content).toMatch(/rights|delete|access/i);
  });

  test("displays last updated date", async ({ page }) => {
    await page.goto("/privacy");
    const content = await page.textContent("main");
    expect(content).toMatch(/last updated|effective date/i);
  });
});
