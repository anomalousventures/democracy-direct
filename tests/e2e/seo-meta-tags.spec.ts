import { test, expect } from "@playwright/test";

test.describe("SEO Meta Tags", () => {
  test.describe("Homepage", () => {
    test("has proper title and description", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/Your Voice, Your Representatives/);

      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute(
        "content",
        /Find and contact your elected officials/
      );
    });

    test("has Open Graph meta tags", async ({ page }) => {
      await page.goto("/");

      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute("content", /Your Voice, Your Representatives/);

      const ogDescription = page.locator('meta[property="og:description"]');
      await expect(ogDescription).toHaveAttribute(
        "content",
        /Find and contact your elected officials/
      );

      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveAttribute("content", /og-default\.png/);
    });

    test("has Twitter Card meta tags", async ({ page }) => {
      await page.goto("/");

      const twitterCard = page.locator('meta[property="twitter:card"]');
      await expect(twitterCard).toHaveAttribute("content", "summary_large_image");

      const twitterTitle = page.locator('meta[property="twitter:title"]');
      await expect(twitterTitle).toHaveAttribute("content", /Your Voice, Your Representatives/);
    });
  });

  test.describe("Templates Index", () => {
    test("has proper title and description", async ({ page }) => {
      await page.goto("/templates");
      await expect(page).toHaveTitle(/Letter Templates/);

      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute(
        "content",
        /Browse community-contributed letter templates/
      );
    });

    test("has Open Graph meta tags", async ({ page }) => {
      await page.goto("/templates");

      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute("content", /Letter Templates/);

      const ogDescription = page.locator('meta[property="og:description"]');
      await expect(ogDescription).toHaveAttribute(
        "content",
        /Browse community-contributed letter templates/
      );
    });
  });

  test.describe("Rep Page", () => {
    test("uses rep name in title", async ({ page }) => {
      // Use a known legislator bioguide ID (Bernard Sanders)
      await page.goto("/rep/S000033");
      await expect(page).toHaveTitle(/Sanders/);
    });

    test("has Open Graph meta tags with rep image", async ({ page }) => {
      await page.goto("/rep/S000033");

      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute("content", /Sanders/);

      const ogImage = page.locator('meta[property="og:image"]');
      const ogImageContent = await ogImage.getAttribute("content");
      expect(ogImageContent).toBeTruthy();
    });
  });
});
