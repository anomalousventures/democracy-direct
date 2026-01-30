import { test, expect } from "@playwright/test";

test.describe("Share Buttons", () => {
  test.describe("Template Page", () => {
    test("displays share buttons", async ({ page }) => {
      await page.goto("/templates");
      const firstTemplate = page.locator("[data-testid='template-card']").first();
      if ((await firstTemplate.count()) > 0) {
        const href = await firstTemplate.locator("a").getAttribute("href");
        if (href) {
          await page.goto(href);
          await expect(page.locator('text="Share:"')).toBeVisible();
        }
      }
    });

    test("copy link button is visible and clickable", async ({ page }) => {
      await page.goto("/templates");

      const firstTemplate = page.locator("[data-testid='template-card']").first();
      if ((await firstTemplate.count()) > 0) {
        const href = await firstTemplate.locator("a").getAttribute("href");
        if (href) {
          await page.goto(href);

          const copyButton = page.locator('button[aria-label="Copy link"]');
          await expect(copyButton).toBeVisible();
          await copyButton.click();
        }
      }
    });

    test("shows platform share buttons on desktop", async ({ page }) => {
      await page.goto("/templates");

      const firstTemplate = page.locator("[data-testid='template-card']").first();
      if ((await firstTemplate.count()) > 0) {
        const href = await firstTemplate.locator("a").getAttribute("href");
        if (href) {
          await page.goto(href);

          const hasNativeShare = await page.locator('button[aria-label="Share"]').isVisible();

          if (!hasNativeShare) {
            const twitterButton = page.locator('button[aria-label="Share on X (Twitter)"]');
            const facebookButton = page.locator('button[aria-label="Share on Facebook"]');
            const redditButton = page.locator('button[aria-label="Share on Reddit"]');
            const emailLink = page.locator('a[aria-label="Share via Email"]');

            await expect(twitterButton).toBeVisible();
            await expect(facebookButton).toBeVisible();
            await expect(redditButton).toBeVisible();
            await expect(emailLink).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Rep Page", () => {
    test("displays share buttons", async ({ page }) => {
      await page.goto("/rep/S000033");
      await expect(page.locator('text="Share:"').first()).toBeVisible();
    });

    test("copy link button is visible and clickable", async ({ page }) => {
      await page.goto("/rep/S000033");

      const copyButton = page.locator('button[aria-label="Copy link"]').first();
      await expect(copyButton).toBeVisible();
      await copyButton.click();
    });
  });
});
