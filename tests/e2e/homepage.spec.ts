import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with 200 status", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Democracy Direct/);
  });

  test("displays hero section with tagline", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByTestId("hero");
    await expect(hero).toBeVisible();
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Your Voice|Representatives/);
  });

  test("ZIP input field exists and is focusable", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toBeVisible();
    await zipInput.focus();
    await expect(zipInput).toBeFocused();
  });

  test("ZIP input has correct attributes", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toHaveAttribute("maxlength", "5");
    await expect(zipInput).toHaveAttribute("inputmode", "numeric");
  });

  test("displays brief explanation of what the site does", async ({ page }) => {
    await page.goto("/");
    const content = await page.textContent("main");
    expect(content).toMatch(/representative|contact|congress/i);
  });

  test("footer links are present", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const aboutLink = footer.getByRole("link", { name: /about/i });
    const privacyLink = footer.getByRole("link", { name: /privacy/i });

    await expect(aboutLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });

  test("footer links navigate correctly", async ({ page }) => {
    await page.goto("/");

    const aboutLink = page.locator("footer").getByRole("link", { name: /about/i });
    await aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
  });
});
