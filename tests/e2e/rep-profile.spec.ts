import { test, expect } from "@playwright/test";

test.describe("Representative Profile Page", () => {
  test("shows error for invalid bioguide ID format (too short)", async ({ page }) => {
    await page.goto("/rep/invalid");
    const error = page.getByText(/invalid representative|not found/i);
    await expect(error).toBeVisible();
  });

  test("shows error for invalid bioguide ID format (numbers only)", async ({ page }) => {
    await page.goto("/rep/1234567");
    const error = page.getByText(/invalid representative|not found/i);
    await expect(error).toBeVisible();
  });

  test("displays find representatives button on error", async ({ page }) => {
    await page.goto("/rep/invalid");
    const findRepsButton = page.getByRole("link", {
      name: /find.*representatives/i,
    });
    await expect(findRepsButton).toBeVisible();
    await expect(findRepsButton).toHaveAttribute("href", "/");
  });

  test("page renders for valid format bioguide ID", async ({ page }) => {
    const response = await page.goto("/rep/A000360");
    expect(response?.status()).toBeLessThan(500);
  });

  test("header navigation is present", async ({ page }) => {
    await page.goto("/rep/A000360");
    const logo = page.getByRole("link", { name: /democracy direct/i });
    await expect(logo).toBeVisible();
  });

  test("about link in header works", async ({ page }) => {
    await page.goto("/rep/A000360");
    const aboutLink = page.locator("header").getByRole("link", { name: /about/i });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute("href", "/about");
  });
});
