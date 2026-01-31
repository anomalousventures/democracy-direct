import { test, expect } from "./fixtures/auth";

test.describe("Saved District - Authenticated User", () => {
  test("shows save district prompt after ZIP lookup", async ({ userPage }) => {
    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText("Save District");
  });

  test("saves district to server when logged in", async ({ userPage }) => {
    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();

    await expect(userPage.getByText("District saved!")).toBeVisible();
    await expect(userPage.getByText("has been saved to your account")).toBeVisible();
  });

  test("shows saved district in user menu after saving", async ({ userPage }) => {
    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();
    await expect(userPage.getByTestId("save-district-success")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const userMenuTrigger = userPage.getByTestId("user-menu-trigger");
    await userMenuTrigger.click();

    const dropdownContent = userPage.locator('[role="menu"]');
    await expect(dropdownContent.getByText("NY-12")).toBeVisible();
    await expect(userPage.getByRole("menuitem", { name: "View My Reps" })).toBeVisible();
  });

  test("can clear saved district from user menu", async ({ userPage }) => {
    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");
    await userPage.getByTestId("save-district-button").click();
    await expect(userPage.getByTestId("save-district-success")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const userMenuTrigger = userPage.getByTestId("user-menu-trigger");
    await userMenuTrigger.click();

    const changeButton = userPage.getByRole("menuitem", { name: "Change District" });
    await changeButton.click();

    await userPage.waitForLoadState("networkidle");

    await userMenuTrigger.click();
    const dropdownContent = userPage.locator('[role="menu"]');
    await expect(dropdownContent.getByText("NY-12")).not.toBeVisible();
  });

  test("prompt indicates server storage for logged in users", async ({ userPage }) => {
    await userPage.goto("/zip/10001");
    await userPage.waitForLoadState("networkidle");

    await expect(
      userPage.getByText("Quick access to your representatives from any device")
    ).toBeVisible();
  });
});
