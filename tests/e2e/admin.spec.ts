import { test, expect } from "./fixtures/auth";

test.describe("Admin Dashboard", () => {
  test("non-admin is redirected", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to home page (login=required param is consumed by toast)
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
  });

  test("admin sees dashboard with stats", async ({ adminPage }) => {
    await adminPage.goto("/admin");

    await expect(adminPage.getByText("Admin Dashboard")).toBeVisible();
    await expect(adminPage.getByTestId("stat-pending")).toBeVisible();
    await expect(adminPage.getByTestId("stat-flagged")).toBeVisible();
    await expect(adminPage.getByTestId("stat-users")).toBeVisible();
    await expect(adminPage.getByTestId("stat-templates")).toBeVisible();
    await expect(adminPage.getByTestId("link-queue")).toBeVisible();
    await expect(adminPage.getByTestId("link-users")).toBeVisible();
    await expect(adminPage.getByTestId("link-tags")).toBeVisible();
  });
});

test.describe("Admin Tag Suggestions", () => {
  test("non-admin is redirected from tags page", async ({ page }) => {
    await page.goto("/admin/tags");

    // Should redirect to home page (login=required param is consumed by toast)
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
  });

  test("admin can access tag suggestions page", async ({ adminPage }) => {
    await adminPage.goto("/admin/tags");

    await expect(adminPage.getByText("Tag Suggestions")).toBeVisible();
  });
});
