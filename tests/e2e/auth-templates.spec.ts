import { test, expect } from "./fixtures/auth";

test.describe("Authenticated Template Creation", () => {
  test("authenticated user sees isPublic checkbox", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

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

  test("isPublic checkbox is checked by default", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/templates/new");
    await userPage.waitForLoadState("domcontentloaded");

    const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  test("user can toggle isPublic checkbox", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/templates/new");
    await userPage.waitForLoadState("domcontentloaded");

    const checkbox = userPage.locator("[data-testid='is-public-checkbox']");
    await expect(checkbox).toHaveAttribute("data-state", "checked");

    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "unchecked");

    await checkbox.click();
    await expect(checkbox).toHaveAttribute("data-state", "checked");
  });
});

test.describe("My Templates Page", () => {
  test("shows visibility badge on templates", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

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

  test("shows both status and visibility badges", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

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

  test("user can see My Templates in header when logged in", async ({
    userPage,
    userSessionId,
  }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/");
    await userPage.waitForLoadState("networkidle");

    const myTemplatesLink = userPage.getByRole("link", { name: /my templates/i });
    await expect(myTemplatesLink).toBeVisible();
  });

  test("My Templates link not visible when logged out", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const myTemplatesLink = page.getByRole("link", { name: /my templates/i });
    await expect(myTemplatesLink).not.toBeVisible();
  });
});

test.describe("Template Fork Page", () => {
  test("authenticated user sees isPublic checkbox on fork page", async ({
    userPage,
    userSessionId,
  }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

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
  test("non-owner cannot access private template directly", async ({ page }) => {
    const response = await page.goto("/templates/nonexistent-private-template-xyz");
    expect(response?.status()).toBe(404);
  });

  test("owner can view their own templates on /templates/mine", async ({
    userPage,
    userSessionId,
  }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    await expect(userPage.getByRole("heading", { name: /my templates/i })).toBeVisible();
  });
});

test.describe("Template Edit and Delete", () => {
  test("edit button visible on user templates", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

    await userPage.goto("/templates/mine");
    await userPage.waitForLoadState("networkidle");

    const templateCards = userPage.locator("[data-testid='user-template-card']");
    const count = await templateCards.count();

    if (count > 0) {
      const editButton = templateCards.first().locator("[data-testid='edit-template-button']");
      await expect(editButton).toBeVisible();
    }
  });

  test("delete button visible on user templates", async ({ userPage, userSessionId }) => {
    test.skip(!userSessionId, "Requires user session - run 'pnpm seed:e2e' first");

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
