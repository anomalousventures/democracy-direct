import { test, expect } from "@playwright/test";

test.describe("Roadmap Page", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/roadmap");
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/roadmap");
    await expect(page).toHaveTitle(/Roadmap.*Democracy Direct/);
  });

  test("contains Completed section", async ({ page }) => {
    await page.goto("/roadmap");
    const completedHeading = page.locator("#completed-heading");
    await expect(completedHeading).toBeVisible();
    await expect(completedHeading).toContainText("Completed");
  });

  test("does not contain Up Next section", async ({ page }) => {
    await page.goto("/roadmap");
    const upNextHeading = page.locator("#upnext-heading");
    await expect(upNextHeading).not.toBeAttached();
  });

  test("Planned section removed (all features completed)", async ({ page }) => {
    await page.goto("/roadmap");
    const plannedHeading = page.locator("#planned-heading");
    await expect(plannedHeading).not.toBeAttached();
  });

  test("has Suggest a Feature link to GitHub Discussions", async ({ page }) => {
    await page.goto("/roadmap");
    const suggestLink = page.getByRole("link", { name: /Suggest a Feature/i });
    await expect(suggestLink).toBeVisible();
    await expect(suggestLink).toHaveAttribute(
      "href",
      "https://github.com/anomalousventures/democracy-direct/discussions"
    );
  });

  test("lists completed features", async ({ page }) => {
    await page.goto("/roadmap");
    const completedSection = page.locator('section[aria-labelledby="completed-heading"]');
    await expect(completedSection.getByRole("heading", { name: "ZIP Code Lookup" })).toBeVisible();
    await expect(completedSection.getByRole("heading", { name: "Letter Templates" })).toBeVisible();
  });

  test("lists shipped features in completed section", async ({ page }) => {
    await page.goto("/roadmap");
    const completedSection = page.locator('section[aria-labelledby="completed-heading"]');
    await expect(completedSection.getByRole("heading", { name: "Voting Records" })).toBeVisible();
    await expect(
      completedSection.getByRole("heading", { name: "Legislation Search" })
    ).toBeVisible();
  });
});
