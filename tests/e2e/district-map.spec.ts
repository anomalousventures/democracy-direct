import { test, expect } from "@playwright/test";

test.describe("District Map Page", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveTitle(/District Map.*Democracy Direct/);
  });

  test("has correct meta description", async ({ page }) => {
    await page.goto("/map");
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /congressional district/i);
  });

  test("displays page heading", async ({ page }) => {
    await page.goto("/map");
    const heading = page.getByRole("heading", {
      name: /Congressional District Map/,
    });
    await expect(heading).toBeVisible();
  });

  test("map canvas renders after hydration", async ({ page }) => {
    await page.goto("/map");
    const canvas = page.locator(".map-area canvas");
    await expect(canvas).toBeVisible({ timeout: 20_000 });
  });

  test("loading skeleton is replaced by map or error state", async ({ page }) => {
    await page.goto("/map");

    const loadingText = page.getByText("Loading district map");
    const canvas = page.locator(".map-area canvas");
    const errorOverlay = page.getByText(/Could not load district boundaries/);

    await expect(loadingText.or(canvas)).toBeVisible({ timeout: 5_000 });

    await expect(canvas.or(errorOverlay)).toBeVisible({ timeout: 20_000 });
  });

  test("attribution text is present", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByText("Stadia Maps")).toBeVisible();
    await expect(page.getByText("U.S. Census Bureau")).toBeVisible();
  });
});

test.describe("District Map Navigation", () => {
  test("header navigation contains map link", async ({ page }) => {
    await page.goto("/");
    const navLink = page.locator('header a[href="/map"]');
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveText("Map");
  });

  test("clicking map link navigates to map page", async ({ page }) => {
    await page.goto("/");
    await page.locator('header a[href="/map"]').click();
    await page.waitForURL("**/map");
    await expect(page).toHaveTitle(/District Map/);
  });
});
