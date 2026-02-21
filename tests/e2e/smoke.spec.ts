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

    // Wait for search results to render (component fetches on mount)
    const templateCards = page.locator("[data-testid='template-card']");
    const noResults = page.locator("[data-testid='no-results']");
    await expect(templateCards.first().or(noResults)).toBeVisible();
  });

  test("template search input is functional", async ({ page }) => {
    // Wait for initial mount fetch to complete (proves React hydration)
    const mountResponse = page.waitForResponse((resp) =>
      resp.url().includes("/api/templates/search")
    );
    await page.goto("/templates");
    await mountResponse;

    const searchInput = page.locator("[data-testid='template-search-input']");
    await expect(searchInput).toBeVisible();

    // Set up response listener before typing (debounce fires after 300ms)
    const searchResponse = page.waitForResponse(
      (resp) => resp.url().includes("/api/templates/search") && resp.url().includes("search=test")
    );
    await searchInput.fill("test");
    const response = await searchResponse;
    expect(response.status()).toBe(200);

    const templateCards = page.locator("[data-testid='template-card']");
    const noResults = page.locator("[data-testid='no-results']");
    await expect(templateCards.first().or(noResults)).toBeVisible();
  });

  test("login modal opens with email input", async ({ page }) => {
    await page.goto("/");

    // Use data-testid to ensure we target the React-hydrated button
    const signInButton = page.locator("[data-testid='sign-in-button']");
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.locator("[data-testid='turnstile-widget']")).toBeAttached();
  });

  test("template form loads with turnstile", async ({ page }) => {
    await page.goto("/templates/new");
    await expect(page.locator("[data-testid='turnstile-widget']")).toBeAttached();
  });

  test("legislation search page loads with filters", async ({ page }) => {
    const response = await page.goto("/legislation");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(page.locator("[data-testid='bill-search-input']")).toBeVisible();
    await expect(page.locator("[data-testid='type-filter']")).toBeVisible();
    await expect(page.locator("[data-testid='status-filter']")).toBeVisible();
  });

  test("legislation search returns results", async ({ page }) => {
    const apiResponse = page.waitForResponse((resp) =>
      resp.url().includes("/api/legislation/search")
    );
    await page.goto("/legislation");
    const response = await apiResponse;
    expect(response.status()).toBe(200);

    const billCards = page.locator("[data-testid='bill-card']");
    await expect(billCards.first()).toBeVisible();
  });

  test("bill detail page loads from search", async ({ page }) => {
    await page.goto("/legislation");

    // Wait for initial results to load
    const billCards = page.locator("[data-testid='bill-card']");
    await expect(billCards.first()).toBeVisible();

    // Navigate to first bill
    await billCards.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("tab", { name: /summary/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /votes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /amendments/i })).toBeVisible();
  });

  test("map page loads", async ({ page }) => {
    const response = await page.goto("/map");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /Congressional District Map/ })).toBeVisible();
  });

  test("zip lookup resolves to district selection", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toBeVisible();

    await zipInput.fill("90210");
    const submitButton = page.getByRole("button", { name: /find my reps/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText("Your ZIP code spans multiple districts")).toBeVisible();
  });
});
