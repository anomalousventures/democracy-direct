import { test, expect } from "@playwright/test";

test.describe("ZIP Lookup Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("navigates to ZIP results page for valid ZIP using real data", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("10001");
    await page.getByRole("button", { name: /find/i }).click();

    await page.waitForURL("**/zip/10001**");
    await expect(page.getByText(/your representatives/i)).toBeVisible();
  });

  test("shows disambiguation for ambiguous ZIP using real data", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("10003");
    await page.getByRole("button", { name: /find/i }).click();

    const disambiguationHeading = page.getByRole("heading", {
      name: /multiple districts/i,
    });
    await expect(disambiguationHeading).toBeVisible();
  });

  test("can enter ZIP and submit button exists", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await expect(zipInput).toBeVisible();
    await expect(zipInput).toBeFocused();

    await zipInput.fill("10001");
    const submitButton = page.getByRole("button", { name: /find/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("button is disabled for incomplete ZIP", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("1234");
    const submitButton = page.getByRole("button", { name: /find/i });
    await expect(submitButton).toBeDisabled();
  });

  test("prevents form submission for incomplete ZIP", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("1234");

    const submitButton = page.getByRole("button", { name: /find/i });
    await expect(submitButton).toBeDisabled();
    expect(page.url()).not.toContain("/zip/");
  });

  test("shows error for unknown ZIP", async ({ page }) => {
    await page.route("**/data/zip-districts.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("00000");
    await page.getByRole("button", { name: /find/i }).click();

    const error = page.getByText(/don't have district data/i);
    await expect(error).toBeVisible();
  });

  test("shows loading state while fetching", async ({ page }) => {
    await page.route("**/data/zip-districts.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          "10001": { s: "NY", d: [{ d: "12", p: 1.0 }] },
        }),
      });
    });

    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("10001");
    await page.getByRole("button", { name: /find/i }).click();

    const loadingIndicator = page.getByText(/searching/i);
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test("shows disambiguation for split ZIP", async ({ page }) => {
    await page.route("**/data/zip-districts.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          "10002": {
            s: "NY",
            d: [
              { d: "7", p: 0.6 },
              { d: "12", p: 0.4 },
            ],
          },
        }),
      });
    });

    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("10002");
    await page.getByRole("button", { name: /find/i }).click();

    const disambiguationHeading = page.getByRole("heading", {
      name: /multiple districts/i,
    });
    await expect(disambiguationHeading).toBeVisible();

    const district7 = page.getByText(/NY District 7/i);
    await expect(district7).toBeVisible();
  });

  test("validates ZIP on input - prevents non-numeric characters", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("abc12");
    const value = await zipInput.inputValue();
    expect(value).toMatch(/^\d*$/);
  });

  test("handles ZIP with leading zeros (Massachusetts)", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("01001");
    await page.getByRole("button", { name: /find/i }).click();

    await page.waitForURL("**/zip/01001**");
    await expect(page.getByText(/your representatives/i)).toBeVisible();
  });

  test("handles DC ZIP code", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("20001");
    await page.getByRole("button", { name: /find/i }).click();

    await page.waitForURL("**/zip/20001**");
    await expect(page.getByText("DC At-Large")).toBeVisible();
  });

  test("handles Puerto Rico ZIP code with leading zeros", async ({ page }) => {
    const zipInput = page.getByPlaceholder(/zip/i);
    await zipInput.fill("00601");
    await page.getByRole("button", { name: /find/i }).click();

    await page.waitForURL("**/zip/00601**");
    await expect(page.getByText("PR At-Large")).toBeVisible();
  });
});
