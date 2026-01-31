import { test, expect } from "@playwright/test";
import { createTestOTP, deleteTestUser, cleanupTestOTPs } from "./helpers/db";

const TEST_EMAIL = `e2e-test-${Date.now()}@example.com`;

test.describe("Authentication Flow", () => {
  test.afterAll(async () => {
    await deleteTestUser(TEST_EMAIL);
  });

  test("complete login flow - email, OTP, authenticated state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const emailInput = page.getByPlaceholder("you@example.com");
    await emailInput.fill(TEST_EMAIL);

    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const sendCodeBtn = page.getByRole("button", { name: /send code/i });
    await sendCodeBtn.click();

    const otp = await createTestOTP(TEST_EMAIL);

    const otpInput = page.getByRole("textbox", { name: /verification code/i });
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill(otp);

    const verifyBtn = page.getByRole("button", { name: /verify/i });
    await verifyBtn.click();

    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 10000 });
  });

  test("invalid OTP shows error", async ({ page }) => {
    const uniqueEmail = `e2e-invalid-otp-${Date.now()}@example.com`;

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.getByPlaceholder("you@example.com").fill(uniqueEmail);

    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole("button", { name: /send code/i }).click();

    await createTestOTP(uniqueEmail);

    const otpInput = page.getByRole("textbox", { name: /verification code/i });
    await expect(otpInput).toBeVisible({ timeout: 10000 });

    await otpInput.fill("000000");

    const verifyBtn = page.getByRole("button", { name: /verify/i });
    await verifyBtn.click();

    await expect(page.getByText(/invalid|expired|incorrect/i)).toBeVisible({ timeout: 10000 });

    await cleanupTestOTPs(uniqueEmail);
    await deleteTestUser(uniqueEmail);
  });

  test("session persists across page reload", async ({ page }) => {
    const sessionEmail = `e2e-session-${Date.now()}@example.com`;

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(sessionEmail);

    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole("button", { name: /send code/i }).click();

    const otp = await createTestOTP(sessionEmail);

    const otpInput = page.getByRole("textbox", { name: /verification code/i });
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill(otp);

    await page.getByRole("button", { name: /verify/i }).click();

    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 10000 });

    await deleteTestUser(sessionEmail);
  });

  test("logout clears session", async ({ page }) => {
    const logoutEmail = `e2e-logout-${Date.now()}@example.com`;

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByPlaceholder("you@example.com").fill(logoutEmail);

    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole("button", { name: /send code/i }).click();

    const otp = await createTestOTP(logoutEmail);

    const otpInput = page.getByRole("textbox", { name: /verification code/i });
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill(otp);

    await page.getByRole("button", { name: /verify/i }).click();

    const signOutBtn = page.getByRole("button", { name: /sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });

    await signOutBtn.click();

    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 10000 });

    await deleteTestUser(logoutEmail);
  });

  test("protected /templates/mine redirects unauthenticated users", async ({ page }) => {
    await page.goto("/templates/mine");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/templates");
    expect(page.url()).toContain("login=required");
  });
});

test.describe("Authentication UI", () => {
  test("shows Sign In button when logged out", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test("opens login dialog when clicking Sign In", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/enter your email/i)).toBeVisible();
  });

  test("disables send button for invalid email", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.getByPlaceholder("you@example.com").fill("invalid-email");

    const sendCodeBtn = page.getByRole("button", { name: /send code/i });
    await expect(sendCodeBtn).toBeDisabled();
  });

  test("My Templates link visible only when logged in", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /my templates/i })).not.toBeVisible();
  });
});
