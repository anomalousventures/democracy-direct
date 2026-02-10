import { test, expect } from "@playwright/test";
import { E2E_AMENDMENT } from "./global-setup";

const AMENDMENT_URL = "/legislation/amendment/hamdt9999-119";

test.describe("Amendment Detail Page", () => {
  test("page loads with amendment data", async ({ page }) => {
    const response = await page.goto(AMENDMENT_URL);
    expect(response?.status()).toBe(200);

    await expect(page.getByText("HAMDT.Amdt.9999")).toBeVisible();
  });

  test("displays amendment description", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(E2E_AMENDMENT.description!);
  });

  test("displays congress number", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    await expect(page.getByText(/119th Congress/)).toBeVisible();
  });

  test("displays chamber badge", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    await expect(page.getByText("House")).toBeVisible();
  });

  test("shows back link to parent bill", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    const backLink = page.locator(".link-back");
    await expect(backLink).toBeVisible();
  });

  test("displays sponsor link", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    const sponsorLink = page.getByText("Sponsored by").locator("..");
    await expect(sponsorLink).toBeVisible();
  });

  test("displays latest action section", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    await expect(page.getByText("Latest Action")).toBeVisible();
    await expect(page.getByText("Amendment agreed to by voice vote.")).toBeVisible();
  });

  test("shows Congress.gov external link", async ({ page }) => {
    await page.goto(AMENDMENT_URL);

    const externalLink = page.getByRole("link", { name: /Congress\.gov/i });
    await expect(externalLink).toBeVisible();
    await expect(externalLink).toHaveAttribute("target", "_blank");
  });

  test("returns 404 for invalid amendment ID format", async ({ page }) => {
    const response = await page.goto("/legislation/amendment/invalid");
    expect(response?.status()).toBe(404);
  });

  test("returns 404 for non-existent amendment", async ({ page }) => {
    const response = await page.goto("/legislation/amendment/hamdt88888-119");
    expect(response?.status()).toBe(404);
  });
});
