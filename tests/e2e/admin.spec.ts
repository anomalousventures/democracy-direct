import { test, expect } from "./fixtures/auth";

test.describe("Admin Dashboard", () => {
  test("non-admin is redirected", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\?login=required/);
  });

  test("admin sees dashboard with stats", async ({ adminPage, adminSessionId }) => {
    test.skip(!adminSessionId, "Requires admin session - run 'pnpm seed:e2e' first");

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

    await expect(page).toHaveURL(/\?login=required/);
  });

  test("admin can access tag suggestions page", async ({ adminPage, adminSessionId }) => {
    test.skip(!adminSessionId, "Requires admin session - run 'pnpm seed:e2e' first");

    await adminPage.goto("/admin/tags");

    await expect(adminPage.getByText("Tag Suggestions")).toBeVisible();
  });
});
