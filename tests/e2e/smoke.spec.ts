import { test, expect } from "@playwright/test";

test.describe("Production Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("templates page loads and fetches from API", async ({ page }) => {
    const response = await page.goto("/templates");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Wait for the search API to complete (component fetches on mount)
    await page.waitForLoadState("networkidle");

    // Either we have template cards or the no-results message
    const templateCards = page.locator("[data-testid='template-card']");
    const noResults = page.locator("[data-testid='no-results']");
    const hasCards = (await templateCards.count()) > 0;
    const hasNoResults = await noResults.isVisible().catch(() => false);

    expect(hasCards || hasNoResults).toBe(true);
  });

  test("template search input is functional", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    // Type in the search box
    await searchInput.fill("test");

    // Wait for debounce and API call
    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    // Page should still be functional (no errors)
    await expect(searchInput).toHaveValue("test");
  });

  test("login modal opens with email input", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("zip lookup form is interactive", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toBeVisible();
    await expect(zipInput).toBeEnabled();
  });
});
