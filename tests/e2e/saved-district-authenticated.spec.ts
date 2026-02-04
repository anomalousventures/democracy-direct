import { test, expect } from "./fixtures/auth";

test.describe("Saved District - Authenticated User", () => {
  test("shows save district prompt on reps page", async ({ userPage }) => {
    await userPage.goto("/reps/ny/12");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toContainText("Save District");
  });

  test("saves district to server when logged in", async ({ userPage }) => {
    await userPage.goto("/reps/ny/12");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();

    await expect(userPage.getByText("District saved!")).toBeVisible();
    await expect(userPage.getByText("has been saved to your account")).toBeVisible();
  });

  test("shows saved district in user menu after saving", async ({ userPage }) => {
    await userPage.goto("/reps/ny/12");
    await userPage.waitForLoadState("networkidle");

    const saveButton = userPage.getByTestId("save-district-button");
    await saveButton.click();
    await expect(userPage.getByTestId("save-district-success")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    // On desktop, district is shown in a separate badge dropdown
    const districtBadge = userPage.getByTestId("district-badge");
    await expect(districtBadge).toBeVisible();
    await expect(districtBadge).toContainText("NY-12");

    await districtBadge.click();
    await expect(userPage.getByRole("menuitem", { name: "View My Reps" })).toBeVisible();
  });

  test("can clear saved district from user menu", async ({ userPage }) => {
    await userPage.goto("/reps/ny/12");
    await userPage.waitForLoadState("networkidle");
    await userPage.getByTestId("save-district-button").click();
    await expect(userPage.getByTestId("save-district-success")).toBeVisible();

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    // On desktop, district is shown in a separate badge dropdown
    const districtBadge = userPage.getByTestId("district-badge");
    await districtBadge.click();

    const clearButton = userPage.getByRole("menuitem", { name: "Clear Saved District" });
    await clearButton.click();

    await userPage.waitForURL("/");

    // After clearing, district badge should no longer be visible
    await expect(districtBadge).not.toBeVisible();
  });

  test("prompt indicates server storage for logged in users", async ({ userPage }) => {
    await userPage.goto("/reps/ny/12");
    await userPage.waitForLoadState("networkidle");

    await expect(
      userPage.getByText("Quick access to your representatives from any device")
    ).toBeVisible();
  });
});
