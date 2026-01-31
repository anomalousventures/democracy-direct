import { test, expect } from "@playwright/test";

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

  test("can enter email in login dialog", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /sign in/i }).click();

    const emailInput = page.getByPlaceholder("you@example.com");
    await expect(emailInput).toBeVisible();

    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });

  test("shows OTP step after submitting email", async ({ page }) => {
    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const signInBtn = page.getByRole("button", { name: /sign in/i });
    await signInBtn.waitFor({ state: "visible" });
    await signInBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const emailInput = page.getByPlaceholder("you@example.com");
    await emailInput.waitFor({ state: "visible" });
    await emailInput.fill("test@example.com");

    const sendCodeBtn = page.getByRole("button", { name: /send code/i });
    await sendCodeBtn.click();

    const otpInput = page.getByRole("textbox", { name: /verification code/i });
    await expect(otpInput).toBeVisible({ timeout: 10000 });
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
});
