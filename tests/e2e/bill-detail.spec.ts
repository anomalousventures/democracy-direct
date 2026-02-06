import { test, expect } from "@playwright/test";
import { E2E_BILL } from "./global-setup";

const BILL_URL = "/legislation/hr9999-119";

test.describe("Bill Detail Page", () => {
  test("page loads with bill data", async ({ page }) => {
    const response = await page.goto(BILL_URL);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(E2E_BILL.title);
  });

  test("displays bill number badge", async ({ page }) => {
    await page.goto(BILL_URL);

    await expect(page.getByText("H.R.9999", { exact: true })).toBeVisible();
  });

  test("displays status badge", async ({ page }) => {
    await page.goto(BILL_URL);

    await expect(page.locator("span").filter({ hasText: "Introduced" }).first()).toBeVisible();
  });

  test("displays congress and chamber info", async ({ page }) => {
    await page.goto(BILL_URL);

    await expect(page.getByText(/119th Congress/)).toBeVisible();
    await expect(page.getByText(/House Bill/)).toBeVisible();
  });

  test("shows back link to legislation search", async ({ page }) => {
    await page.goto(BILL_URL);

    const backLink = page.locator(".link-back");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/legislation");
  });

  test("displays bill tabs (Summary, Votes, Amendments)", async ({ page }) => {
    await page.goto(BILL_URL);
    await page.waitForLoadState("networkidle");

    const summaryTab = page.getByRole("tab", { name: /summary/i });
    await expect(summaryTab).toBeVisible();

    const votesTab = page.getByRole("tab", { name: /votes/i });
    await expect(votesTab).toBeVisible();

    const amendmentsTab = page.getByRole("tab", { name: /amendments/i });
    await expect(amendmentsTab).toBeVisible();
  });

  test("summary tab shows bill details by default", async ({ page }) => {
    await page.goto(BILL_URL);
    await page.waitForLoadState("networkidle");

    const summaryTab = page.getByRole("tab", { name: /summary/i });
    await expect(summaryTab).toHaveAttribute("aria-selected", "true");

    await expect(page.getByText(E2E_BILL.summary!)).toBeVisible();
  });

  test("shows template CTA buttons", async ({ page }) => {
    await page.goto(BILL_URL);

    await expect(page.getByRole("link", { name: /browse templates/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /write a template/i })).toBeVisible();
  });

  test("returns 404 for invalid bill ID format", async ({ page }) => {
    const response = await page.goto("/legislation/invalid");
    expect(response?.status()).toBe(404);
  });

  test("returns 404 for non-existent bill", async ({ page }) => {
    const response = await page.goto("/legislation/hr88888-119");
    expect(response?.status()).toBe(404);
  });
});
