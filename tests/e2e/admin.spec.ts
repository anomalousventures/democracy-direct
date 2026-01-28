import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("non-admin is redirected", async ({ page }) => {
    await page.goto("/admin");

    // Not logged in - should redirect to home with login=required
    await expect(page).toHaveURL(/\?login=required/);
  });

  test("admin sees dashboard with stats", async ({ page }) => {
    // This test requires an admin session - skip if not available
    // In a real setup, we'd seed an admin user and create a session
    test.skip(true, "Requires admin session setup");

    await page.goto("/admin");

    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByTestId("stat-pending")).toBeVisible();
    await expect(page.getByTestId("stat-flagged")).toBeVisible();
    await expect(page.getByTestId("stat-users")).toBeVisible();
    await expect(page.getByTestId("stat-templates")).toBeVisible();
    await expect(page.getByTestId("link-queue")).toBeVisible();
    await expect(page.getByTestId("link-users")).toBeVisible();
    await expect(page.getByTestId("link-tags")).toBeVisible();
  });
});

test.describe("Admin Tag Suggestions", () => {
  test("non-admin is redirected from tags page", async ({ page }) => {
    await page.goto("/admin/tags");

    await expect(page).toHaveURL(/\?login=required/);
  });

  test("admin can manage tag suggestions", async ({ page }) => {
    test.skip(true, "Requires admin session setup with pending tag suggestions");

    await page.goto("/admin/tags");

    await expect(page.getByText("Tag Suggestions")).toBeVisible();
    await expect(page.getByTestId("tag-items")).toBeVisible();

    const tagItem = page.getByTestId("tag-item").first();
    await expect(tagItem.getByTestId("approve-button")).toBeVisible();
    await expect(tagItem.getByTestId("reject-button")).toBeVisible();
  });
});
