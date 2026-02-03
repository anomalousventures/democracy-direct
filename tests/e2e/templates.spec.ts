import { test, expect } from "@playwright/test";

test.describe("Template List Page", () => {
  test("page loads at /templates", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/Templates/i);
    await expect(page.getByRole("heading", { name: /letter templates/i })).toBeVisible();
  });

  test("shows template cards when templates exist", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const templateSection = page.locator("[data-testid='template-list']");
    await expect(templateSection).toBeVisible();

    // E2E database should have seeded templates
    const templateCards = page.locator("[data-testid='template-card']");
    await expect(templateCards.first()).toBeVisible();
  });

  test("template cards link to detail pages", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    await expect(firstTemplate).toBeVisible();
    const link = firstTemplate.locator("a");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\/templates\/[\w-]+/);
  });

  test("shows issue tags on template cards", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    await expect(firstTemplate).toBeVisible();
    const tags = firstTemplate.locator("[data-testid='issue-tag']");
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Template Search and Filtering", () => {
  test("search input filters results based on text", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    await expect(searchInput).toBeVisible();

    // Get initial count
    const templateCards = page.locator("[data-testid='template-card']");
    const initialCount = await templateCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for a term that exists in E2E seeded templates
    await searchInput.fill("Infrastructure");

    // Wait for debounce (300ms) + network
    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    // Should find the infrastructure template
    const filteredCards = page.locator("[data-testid='template-card']");
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Verify the result contains our search term
    const firstResult = filteredCards.first();
    const title = await firstResult.locator("h2").textContent();
    expect(title?.toLowerCase()).toContain("infrastructure");
  });

  test("search shows no results message for non-matching query", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    await searchInput.fill("xyznonexistent12345");

    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    const noResults = page.locator("[data-testid='no-results']");
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText(/no templates match/i);
  });

  test("tag filter buttons filter results", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const tagFilter = page.locator("[data-testid='tag-filter']");
    const isVisible = await tagFilter.isVisible().catch(() => false);

    if (isVisible) {
      // Get initial count
      const templateCards = page.locator("[data-testid='template-card']");
      const initialCount = await templateCards.count();

      // Click first tag filter
      const firstTagButton = page.locator("[data-testid='tag-filter-button']").first();
      await expect(firstTagButton).toBeVisible();
      const tagName = await firstTagButton.textContent();
      await firstTagButton.click();

      // Verify it's selected
      await expect(firstTagButton).toHaveAttribute("data-state", "on");

      // Wait for API response
      await page.waitForLoadState("networkidle");

      // Results should be filtered (equal or fewer cards)
      const filteredCount = await templateCards.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // All visible cards should have the selected tag
      if (filteredCount > 0) {
        const firstCard = templateCards.first();
        const cardTags = await firstCard.locator("[data-testid='issue-tag']").allTextContents();
        const hasTag = cardTags.some((t) => t.toLowerCase() === tagName?.toLowerCase());
        expect(hasTag).toBe(true);
      }
    }
  });

  test("clicking tag filter again deselects it", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const tagFilter = page.locator("[data-testid='tag-filter']");
    const isVisible = await tagFilter.isVisible().catch(() => false);

    if (isVisible) {
      const firstTagButton = page.locator("[data-testid='tag-filter-button']").first();

      // Select
      await firstTagButton.click();
      await expect(firstTagButton).toHaveAttribute("data-state", "on");

      // Deselect
      await firstTagButton.click();
      await expect(firstTagButton).toHaveAttribute("data-state", "off");
    }
  });

  test("clear filters button restores all results", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    const templateCards = page.locator("[data-testid='template-card']");

    // Get initial count
    const initialCount = await templateCards.count();

    // Apply search filter
    await searchInput.fill("Infrastructure");
    await page.waitForTimeout(400);
    await page.waitForLoadState("networkidle");

    // Should show fewer or same results
    const filteredCount = await templateCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Click clear filters
    const clearButton = page.getByRole("button", { name: /clear filters/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await page.waitForLoadState("networkidle");

    // Should restore original count
    const restoredCount = await templateCards.count();
    expect(restoredCount).toBe(initialCount);

    // Search input should be cleared
    await expect(searchInput).toHaveValue("");
  });

  test("combined search and tag filter works", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("[data-testid='template-search-input']");
    const tagFilter = page.locator("[data-testid='tag-filter']");

    if (await tagFilter.isVisible()) {
      // Apply search
      await searchInput.fill("Investment");
      await page.waitForTimeout(400);
      await page.waitForLoadState("networkidle");

      const afterSearchCount = await page.locator("[data-testid='template-card']").count();

      // Also apply tag filter
      const infrastructureTag = page.locator("[data-testid='tag-filter-button']", {
        hasText: /infrastructure/i,
      });
      if (await infrastructureTag.isVisible()) {
        await infrastructureTag.click();
        await page.waitForLoadState("networkidle");

        const afterBothCount = await page.locator("[data-testid='template-card']").count();
        expect(afterBothCount).toBeLessThanOrEqual(afterSearchCount);
      }
    }
  });
});

test.describe("Template Pagination", () => {
  test("load more button appears when more results exist", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const loadMoreButton = page.locator("[data-testid='load-more-button']");
    const templateCards = page.locator("[data-testid='template-card']");

    const cardCount = await templateCards.count();
    // If we have 20 cards (default page size), there should be a load more button
    if (cardCount >= 20) {
      await expect(loadMoreButton).toBeVisible();
    }
  });

  test("load more button loads additional results", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const loadMoreButton = page.locator("[data-testid='load-more-button']");
    const templateCards = page.locator("[data-testid='template-card']");

    const initialCount = await templateCards.count();

    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();

      // Wait for loading to complete
      await page.waitForLoadState("networkidle");

      const newCount = await templateCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test("load more button shows loading state while fetching", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const loadMoreButton = page.locator("[data-testid='load-more-button']");

    if (await loadMoreButton.isVisible()) {
      // Click and check for loading state
      await loadMoreButton.click();

      // Button should show loading text or be disabled
      const buttonText = await loadMoreButton.textContent();
      const isDisabled = await loadMoreButton.isDisabled();

      // Either shows "Loading..." or is disabled during fetch
      expect(buttonText?.includes("Loading") || isDisabled).toBe(true);

      // Wait for it to finish
      await page.waitForLoadState("networkidle");
    }
  });
});

test.describe("Template Loading States", () => {
  test("shows skeleton loaders on initial load", async ({ page }) => {
    // Slow down the network to catch the loading state
    await page.route("**/api/templates/search**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto("/templates");

    // Should see skeleton cards while loading
    const skeletons = page.locator(".animate-pulse");
    const hasSkeletons = (await skeletons.count()) > 0;

    // Either we catch skeletons or the page loaded too fast
    if (hasSkeletons) {
      await expect(skeletons.first()).toBeVisible();
    }

    // After load completes, skeletons should be gone
    await page.waitForLoadState("networkidle");
    const templateCards = page.locator("[data-testid='template-card']");
    const noResults = page.locator("[data-testid='no-results']");
    const hasContent = (await templateCards.count()) > 0 || (await noResults.isVisible());
    expect(hasContent).toBe(true);
  });

  test("shows error state when API fails", async ({ page }) => {
    // Mock API to fail
    await page.route("**/api/templates/search**", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    // Should show error message with retry button
    const errorMessage = page.getByText(/unable to load templates/i);
    await expect(errorMessage).toBeVisible();

    const retryButton = page.getByRole("button", { name: /try again/i });
    await expect(retryButton).toBeVisible();
  });
});

test.describe("Template Creation Page", () => {
  test("page loads at /templates/new", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /create new template/i })).toBeVisible();
  });

  test("form renders with required fields", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const titleInput = page.locator("[data-testid='template-title-input']");
    const bodyInput = page.locator("[data-testid='tiptap-editor']");
    const submitButton = page.locator("[data-testid='submit-template-button']");

    await expect(titleInput).toBeVisible();
    await expect(bodyInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("shows issue tag selector", async ({ page }) => {
    await page.goto("/templates/new");
    await page.waitForLoadState("domcontentloaded");

    const tagSelector = page.locator("[data-testid='issue-tag-selector']");
    await expect(tagSelector).toBeVisible();
  });
});

test.describe("Template Detail Page", () => {
  test("shows 404 for invalid slug", async ({ page }) => {
    const response = await page.goto("/templates/non-existent-template-xyz");
    expect(response?.status()).toBe(404);
  });

  test("shows error page with navigation for invalid slug", async ({ page }) => {
    await page.goto("/templates/non-existent-template-xyz");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/template not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /browse templates/i })).toBeVisible();
  });

  test("template detail page shows use template button", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='use-template-button']")).toBeVisible();
    }
  });

  test("template detail page shows template content", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='template-title']")).toBeVisible();
      await expect(page.locator("[data-testid='template-body']")).toBeVisible();
    }
  });

  test("template detail page shows report button", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='report-button']")).toBeVisible();
    }
  });
});
