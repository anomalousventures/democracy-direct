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

  test("contains Up Next section", async ({ page }) => {
    await page.goto("/roadmap");
    const upNextHeading = page.locator("#upnext-heading");
    await expect(upNextHeading).toBeVisible();
    await expect(upNextHeading).toContainText("Up Next");
  });

  test("contains Planned section", async ({ page }) => {
    await page.goto("/roadmap");
    const plannedHeading = page.locator("#planned-heading");
    await expect(plannedHeading).toBeVisible();
    await expect(plannedHeading).toContainText("Planned");
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
    await expect(completedSection.getByText("ZIP Code Lookup")).toBeVisible();
    await expect(completedSection.getByText("Letter Templates")).toBeVisible();
  });

  test("lists upcoming features", async ({ page }) => {
    await page.goto("/roadmap");
    const upNextSection = page.locator('section[aria-labelledby="upnext-heading"]');
    await expect(upNextSection.getByText("Voting Records")).toBeVisible();
  });
});
