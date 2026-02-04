import { test, expect } from "@playwright/test";

test.describe("Saved District - Anonymous User", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("shows save district prompt on reps page", async ({ page }) => {
    await page.goto("/reps/ny/12");
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByTestId("save-district-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText("Save District");
  });

  test("saves district to localStorage when clicked", async ({ page }) => {
    await page.goto("/reps/ny/12");
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByTestId("save-district-button");
    await saveButton.click();

    await expect(page.getByText("District saved!")).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("democracy-direct-district"));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state).toBe("NY");
    expect(parsed.district).toBe("12");
  });

  test("shows district badge in header after saving", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const badge = page.getByTestId("district-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("NY-12");
  });

  test("View My Reps link in badge dropdown navigates to correct district", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const badge = page.getByTestId("district-badge");
    await badge.click();

    const viewRepsLink = page.getByRole("menuitem", { name: "View My Reps" });
    await expect(viewRepsLink).toBeVisible();
    await expect(viewRepsLink).toHaveAttribute("href", "/reps/ny/12");
  });

  test("Clear Saved District clears saved district and redirects home", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const badge = page.getByTestId("district-badge");
    await badge.click();

    const clearButton = page.getByRole("menuitem", { name: "Clear Saved District" });
    await clearButton.click();

    await page.waitForURL("/");
    await expect(page.getByTestId("district-badge")).not.toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("democracy-direct-district"));
    expect(stored).toBeNull();
  });

  test("reps page displays representatives for saved district", async ({ page }) => {
    await page.goto("/reps/ny/12");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Your Representatives")).toBeVisible();
    await expect(page.getByText("New York District 12")).toBeVisible();
  });

  test("at-large district displays correctly", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "WY", district: "AL" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const badge = page.getByTestId("district-badge");
    await expect(badge).toContainText("WY At-Large");
  });
});
