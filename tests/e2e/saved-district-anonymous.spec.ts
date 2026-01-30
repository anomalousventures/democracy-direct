import { test, expect } from "@playwright/test";

test.describe("Saved District - Anonymous User", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("shows save district prompt after ZIP lookup", async ({ page }) => {
    await page.goto("/zip/10001");
    await page.waitForLoadState("networkidle");

    const saveButton = page.getByTestId("save-district-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText("Save NY-12");
  });

  test("saves district to localStorage when clicked", async ({ page }) => {
    await page.goto("/zip/10001");
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

  test("shows saved district banner on homepage after saving", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const banner = page.getByTestId("saved-district-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("NY-12");
    await expect(banner).toContainText("New York");
  });

  test("View My Reps button navigates to correct district", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const viewRepsButton = page.getByTestId("view-my-reps-button");
    await expect(viewRepsButton).toBeVisible();
    await expect(viewRepsButton).toHaveAttribute("href", "/reps/ny/12");
  });

  test("Change button clears saved district", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "democracy-direct-district",
        JSON.stringify({ state: "NY", district: "12" })
      );
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const changeButton = page.getByTestId("change-district-button");
    await changeButton.click();

    await expect(page.getByTestId("saved-district-banner")).not.toBeVisible();

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

    const banner = page.getByTestId("saved-district-banner");
    await expect(banner).toContainText("WY At-Large");
  });
});
