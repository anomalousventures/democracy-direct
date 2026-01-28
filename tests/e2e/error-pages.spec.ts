import { test, expect } from "@playwright/test";

test.describe("Error Pages", () => {
  test("404 page renders for invalid route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Homepage" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Templates" })).toBeVisible();
  });

  test("404 page has navigation back to home", async ({ page }) => {
    await page.goto("/nonexistent-route");

    const homeLink = page.getByRole("link", { name: "Go to Homepage" });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/");
  });
});
