import { test, expect } from "@playwright/test";

test.describe("Share Buttons", () => {
  test.describe("Template Page", () => {
    test("displays share buttons on template detail page", async ({ page }) => {
      await page.goto("/templates");
      const firstTemplate = page.locator("[data-testid='template-card']").first();

      await expect(firstTemplate).toBeVisible();

      const href = await firstTemplate.locator("a").getAttribute("href");
      expect(href).toBeTruthy();

      await page.goto(href!);

      await expect(page.locator('button[aria-label="Share on X (Twitter)"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Share on Facebook"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Share on Reddit"]')).toBeVisible();
      await expect(page.locator('a[aria-label="Share via Email"]')).toBeVisible();
      await expect(page.locator('button[aria-label="Copy link to clipboard"]')).toBeVisible();
    });

    test("copy link button shows success toast", async ({ page }) => {
      await page.goto("/templates");

      const firstTemplate = page.locator("[data-testid='template-card']").first();
      await expect(firstTemplate).toBeVisible();

      const href = await firstTemplate.locator("a").getAttribute("href");
      expect(href).toBeTruthy();

      await page.goto(href!);

      await page.context().grantPermissions(["clipboard-write"]);

      const copyButton = page.locator('button[aria-label="Copy link to clipboard"]');
      await expect(copyButton).toBeVisible();
      await copyButton.click();

      await expect(page.locator('text="Link copied to clipboard!"')).toBeVisible();
    });

    test("share buttons open in new tab", async ({ page, context }) => {
      await page.goto("/templates");

      const firstTemplate = page.locator("[data-testid='template-card']").first();
      await expect(firstTemplate).toBeVisible();

      const href = await firstTemplate.locator("a").getAttribute("href");
      expect(href).toBeTruthy();

      await page.goto(href!);

      const twitterButton = page.locator('button[aria-label="Share on X (Twitter)"]');
      await expect(twitterButton).toBeVisible();

      const [newPage] = await Promise.all([context.waitForEvent("page"), twitterButton.click()]);

      expect(newPage.url()).toContain("x.com");
      await newPage.close();
    });
  });

  test.describe("Rep Page", () => {
    test("displays share buttons on rep profile", async ({ page }) => {
      await page.goto("/rep/S000033");

      await expect(page.locator('button[aria-label="Share on X (Twitter)"]').first()).toBeVisible();
      await expect(page.locator('button[aria-label="Share on Facebook"]').first()).toBeVisible();
      await expect(page.locator('button[aria-label="Share on Reddit"]').first()).toBeVisible();
      await expect(page.locator('a[aria-label="Share via Email"]').first()).toBeVisible();
      await expect(
        page.locator('button[aria-label="Copy link to clipboard"]').first()
      ).toBeVisible();
    });

    test("copy link button shows success toast on rep page", async ({ page }) => {
      await page.goto("/rep/S000033");

      await page.context().grantPermissions(["clipboard-write"]);

      const copyButton = page.locator('button[aria-label="Copy link to clipboard"]').first();
      await expect(copyButton).toBeVisible();
      await copyButton.click();

      await expect(page.locator('text="Link copied to clipboard!"')).toBeVisible();
    });
  });
});
