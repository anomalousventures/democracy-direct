import { test, expect } from "./fixtures/auth";

test.describe("Saved District - Authenticated User", () => {
  test("shows save district prompt after ZIP lookup", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText("Save NY-12");
  });

  test("saves district to server when logged in", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();

    await expect(userPage.getByText("District saved!")).toBeVisible();
    await expect(userPage.getByText("has been saved to your account")).toBeVisible();
  });

  test("shows saved district banner on homepage for logged in user", async ({
    userPage,
    userSessionId,
  }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();
    await expect(userPage.getByText("District saved!")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const banner = userPage.getByTestId("saved-district-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("NY-12");
  });

  test("can clear saved district", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");
    await userPage.getByTestId("save-district-button").click();
    await expect(userPage.getByText("District saved!")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const changeButton = userPage.getByTestId("change-district-button");
    await changeButton.click();

    await expect(userPage.getByTestId("saved-district-banner")).not.toBeVisible();
  });

  test("prompt indicates server storage for logged in users", async ({
    userPage,
    userSessionId,
  }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    await expect(userPage.getByText("Save your district to your account")).toBeVisible();
  });
});
