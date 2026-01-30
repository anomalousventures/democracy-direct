import { test, expect } from "@playwright/test";

test.describe("Production Smoke Tests", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    // 200 = healthy, 503 = degraded, 403 = Cloudflare WAF (valid for CI runners)
    expect([200, 503, 403]).toContain(response.status());
    if (response.status() !== 403) {
      const body = await response.json();
      expect(["ok", "degraded"]).toContain(body.status);
      expect(body.timestamp).toBeDefined();
    }
  });

  test("homepage loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("templates page loads", async ({ page }) => {
    const response = await page.goto("/templates");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("turnstile script is present", async ({ page }) => {
    await page.goto("/");
    const turnstile = page.locator('script[src*="challenges.cloudflare.com/turnstile"]');
    await expect(turnstile).toBeAttached();
  });

  test("zip lookup form is interactive", async ({ page }) => {
    await page.goto("/");
    const zipInput = page.getByRole("textbox", { name: /zip/i });
    await expect(zipInput).toBeVisible();
    await expect(zipInput).toBeEnabled();
  });
});
