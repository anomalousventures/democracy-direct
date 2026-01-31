import { test, expect } from "./fixtures/auth";
import { E2E_PRIVATE_TEMPLATE_SLUG } from "./global-setup";

test.describe("Authenticated Template Creation", () => {
  test("authenticated user sees isPublic checkbox", async ({ userPage }) => {
    await userPage.goto("/templates/new");
    await userPage.waitForLoadState("domcontentloaded");

    const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).toBeVisible();
  });

  test("anonymous user does not see isPublic checkbox", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const checkbox = page.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).not.toBeVisible();
  });

  test("isPublic checkbox is checked by default", async ({ userPage }) => {
    await userPage.goto("/templates/new");
    await userPage.waitForLoadState("domcontentloaded");

    const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  test("user can toggle isPublic checkbox", async ({ userPage }) => {
    await userPage.goto("/templates/new");
    await userPage.waitForLoadState("load");

    const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute("data-state", "checked");

    // Wait for hydration - the checkbox needs React to be fully loaded
    await userPage.waitForTimeout(1000);

    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "unchecked");

    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });
});

test.describe("My Templates Page", () => {
  test("shows visibility badge on templates", async ({ userPage }) => {
    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    const templateCards = userPage.locator("[data-testid='user-template-card']");
    const count = await templateCards.count();

    if (count > 0) {
      const firstCard = templateCards.first();
      const visibilityBadge = firstCard.locator("[data-testid='template-visibility']");
      await expect(visibilityBadge).toBeVisible();

      const badgeText = await visibilityBadge.textContent();
      expect(badgeText).toMatch(/Public|Private/);
    }
  });

  test("shows both status and visibility badges", async ({ userPage }) => {
    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    const templateCards = userPage.locator("[data-testid='user-template-card']");
    const count = await templateCards.count();

    if (count > 0) {
      const firstCard = templateCards.first();
      await expect(firstCard.locator("[data-testid='template-status']")).toBeVisible();
      await expect(firstCard.locator("[data-testid='template-visibility']")).toBeVisible();
    }
  });

  test("user can see My Templates in user menu when logged in", async ({ userPage }) => {
    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const userMenuTrigger = userPage.locator("[data-testid='user-menu-trigger']");
    await expect(userMenuTrigger).toBeVisible();
    await userMenuTrigger.click();

    const myTemplatesLink = userPage.getByRole("menuitem", { name: /my templates/i });
    await expect(myTemplatesLink).toBeVisible();
  });

  test("My Templates link not visible when logged out", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const userMenuTrigger = page.locator("[data-testid='user-menu-trigger']");
    await expect(userMenuTrigger).not.toBeVisible();

    const signInButton = page.locator("[data-testid='sign-in-button']");
    await expect(signInButton).toBeVisible();
  });
});

test.describe("Template Fork Page", () => {
  test("authenticated user sees isPublic checkbox on fork page", async ({ userPage }) => {
    await userPage.goto("/templates");
    await userPage.waitForLoadState("networkidle");

    const firstTemplate = userPage.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await userPage.waitForLoadState("networkidle");

      const forkButton = userPage.locator("[data-testid='fork-button']");
      if (await forkButton.isVisible()) {
        await forkButton.click();
        await userPage.waitForLoadState("domcontentloaded");

        const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
        await expect(checkbox).toBeVisible();
      }
    }
  });
});

test.describe("Private Template Access Control", () => {
  test("owner can access their private template", async ({ adminPage }) => {
    const response = await adminPage.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(200);
  });

  test("non-owner gets 404 for private template", async ({ userPage }) => {
    const response = await userPage.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(404);
  });

  test("anonymous user gets 404 for private template", async ({ page }) => {
    const response = await page.goto(`/templates/${E2E_PRIVATE_TEMPLATE_SLUG}`);
    expect(response?.status()).toBe(404);
  });

  test("owner can view their own templates on /templates/mine", async ({ userPage }) => {
    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    await expect(userPage.getByRole("heading", { name: /my templates/i })).toBeVisible();
  });
});

test.describe("Template Edit and Delete", () => {
  test("edit button visible on user templates", async ({ userPage }) => {
    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    const templateCards = userPage.locator("[data-testid='user-template-card']");
    const count = await templateCards.count();

    if (count > 0) {
      const editButton = templateCards.first().locator("[data-testid='edit-template-button']");
      await expect(editButton).toBeVisible();
    }
  });

  test("delete button visible on user templates", async ({ userPage }) => {
    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    const templateCards = userPage.locator("[data-testid='user-template-card']");
    const count = await templateCards.count();

    if (count > 0) {
      const deleteButton = templateCards.first().locator("[data-testid='delete-template-button']");
      await expect(deleteButton).toBeVisible();
    }
  });
});
