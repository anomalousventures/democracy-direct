import { test, expect } from "@playwright/test";

const SEARCH_API = "/api/templates/search";

function waitForSearchResponse(page: import("@playwright/test").Page) {
  return page.waitForResponse((resp) => resp.url().includes(SEARCH_API));
}

test.describe("Template List Page", () => {
  test("page loads at /templates", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    await expect(page).toHaveTitle(/Templates/i);
    await expect(page.getByRole("heading", { name: /letter templates/i })).toBeVisible();
  });

  test("shows template cards when templates exist", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const templateSection = page.locator("[data-testid='template-list']");
    await expect(templateSection).toBeVisible();

    const templateCards = page.locator("[data-testid='template-card']");
    await expect(templateCards.first()).toBeVisible();
  });

  test("template cards link to detail pages", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    await expect(firstTemplate).toBeVisible();
    const link = firstTemplate.locator("a");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\/templates\/[\w-]+/);
  });

  test("shows issue tags on template cards", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    await expect(firstTemplate).toBeVisible();
    const tags = firstTemplate.locator("[data-testid='issue-tag']");
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Template Search and Filtering", () => {
  test("search input filters results based on text", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const searchInput = page.locator("[data-testid='template-search-input']");
    await expect(searchInput).toBeVisible();

    const templateCards = page.locator("[data-testid='template-card']");
    const initialCount = await templateCards.count();
    expect(initialCount).toBeGreaterThan(0);

    const searchResponse = page.waitForResponse(
      (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("search=Infrastructure")
    );
    await searchInput.fill("Infrastructure");
    await searchResponse;

    const filteredCards = page.locator("[data-testid='template-card']");
    await expect(filteredCards.first()).toBeVisible();

    await expect(filteredCards.first().locator("h2")).toContainText(/infrastructure/i);
  });

  test("search shows no results message for non-matching query", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const searchInput = page.locator("[data-testid='template-search-input']");

    const searchResponse = page.waitForResponse(
      (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("search=xyznonexistent12345")
    );
    await searchInput.fill("xyznonexistent12345");
    await searchResponse;

    const noResults = page.locator("[data-testid='no-results']");
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText(/no templates match/i);
  });

  test("tag filter buttons filter results", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const tagFilter = page.locator("[data-testid='tag-filter']");
    const isVisible = await tagFilter.isVisible().catch(() => false);

    if (isVisible) {
      const templateCards = page.locator("[data-testid='template-card']");
      const initialCount = await templateCards.count();

      const firstTagButton = page.locator("[data-testid='tag-filter-button']").first();
      await expect(firstTagButton).toBeVisible();
      const tagName = await firstTagButton.textContent();

      const tagResponse = page.waitForResponse(
        (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("tags=")
      );
      await firstTagButton.click();
      await tagResponse;

      await expect(firstTagButton).toHaveAttribute("data-state", "on");

      const filteredCount = await templateCards.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      if (filteredCount > 0) {
        const firstCard = templateCards.first();
        const cardTags = await firstCard.locator("[data-testid='issue-tag']").allTextContents();
        const hasTag = cardTags.some((t) => t.toLowerCase() === tagName?.toLowerCase());
        expect(hasTag).toBe(true);
      }
    }
  });

  test("clicking tag filter again deselects it", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const tagFilter = page.locator("[data-testid='tag-filter']");
    const isVisible = await tagFilter.isVisible().catch(() => false);

    if (isVisible) {
      const firstTagButton = page.locator("[data-testid='tag-filter-button']").first();

      await firstTagButton.click();
      await expect(firstTagButton).toHaveAttribute("data-state", "on");

      await firstTagButton.click();
      await expect(firstTagButton).toHaveAttribute("data-state", "off");
    }
  });

  test("clear filters button restores all results", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const searchInput = page.locator("[data-testid='template-search-input']");
    const templateCards = page.locator("[data-testid='template-card']");

    const initialCount = await templateCards.count();

    const searchResponse = page.waitForResponse(
      (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("search=Infrastructure")
    );
    await searchInput.fill("Infrastructure");
    await searchResponse;

    const filteredCount = await templateCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    const clearButton = page.locator("[data-testid='clear-filters-button']");
    await expect(clearButton).toBeVisible();

    const clearResponse = page.waitForResponse(
      (resp) => resp.url().includes(SEARCH_API) && !resp.url().includes("search=")
    );
    await clearButton.click();
    await clearResponse;

    await expect(templateCards).toHaveCount(initialCount, { timeout: 10000 });
    await expect(searchInput).toHaveValue("");
  });

  test("combined search and tag filter works", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const searchInput = page.locator("[data-testid='template-search-input']");
    const tagFilter = page.locator("[data-testid='tag-filter']");

    if (await tagFilter.isVisible()) {
      const searchResponse = page.waitForResponse(
        (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("search=Investment")
      );
      await searchInput.fill("Investment");
      await searchResponse;

      const afterSearchCount = await page.locator("[data-testid='template-card']").count();

      const infrastructureTag = page.locator("[data-testid='tag-filter-button']", {
        hasText: /infrastructure/i,
      });
      if (await infrastructureTag.isVisible()) {
        const tagResponse = page.waitForResponse(
          (resp) => resp.url().includes(SEARCH_API) && resp.url().includes("tags=")
        );
        await infrastructureTag.click();
        await tagResponse;

        const afterBothCount = await page.locator("[data-testid='template-card']").count();
        expect(afterBothCount).toBeLessThanOrEqual(afterSearchCount);
      }
    }
  });
});

test.describe("Template Pagination", () => {
  test("load more button appears when more results exist", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const loadMoreButton = page.locator("[data-testid='load-more-button']");
    const templateCards = page.locator("[data-testid='template-card']");

    const cardCount = await templateCards.count();
    if (cardCount >= 20) {
      await expect(loadMoreButton).toBeVisible();
    }
  });

  test("load more button loads additional results", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const loadMoreButton = page.locator("[data-testid='load-more-button']");
    const templateCards = page.locator("[data-testid='template-card']");

    const initialCount = await templateCards.count();

    if (await loadMoreButton.isVisible()) {
      const loadMoreResponse = waitForSearchResponse(page);
      await loadMoreButton.click();
      await loadMoreResponse;

      const newCount = await templateCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test("load more button shows loading state while fetching", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const loadMoreButton = page.locator("[data-testid='load-more-button']");

    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();

      const buttonText = await loadMoreButton.textContent();
      const isDisabled = await loadMoreButton.isDisabled();

      expect(buttonText?.includes("Loading") || isDisabled).toBe(true);

      await waitForSearchResponse(page);
    }
  });
});

test.describe("Template Loading States", () => {
  test("shows skeleton loaders on initial load", async ({ page }) => {
    await page.route("**/api/templates/search**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto("/templates");

    const skeletons = page.locator(".animate-pulse");
    const hasSkeletons = (await skeletons.count()) > 0;

    if (hasSkeletons) {
      await expect(skeletons.first()).toBeVisible();
    }

    await waitForSearchResponse(page);
    const templateCards = page.locator("[data-testid='template-card']");
    const noResults = page.locator("[data-testid='no-results']");
    const hasContent = (await templateCards.count()) > 0 || (await noResults.isVisible());
    expect(hasContent).toBe(true);
  });

  test("shows error state when API fails", async ({ page }) => {
    await page.route("**/api/templates/search**", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("/templates");
    await page.waitForLoadState("networkidle");

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
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='use-template-button']")).toBeVisible();
    }
  });

  test("template detail page shows template content", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='template-title']")).toBeVisible();
      await expect(page.locator("[data-testid='template-body']")).toBeVisible();
    }
  });

  test("template detail page shows report button", async ({ page }) => {
    const mountResponse = waitForSearchResponse(page);
    await page.goto("/templates");
    await mountResponse;

    const firstTemplate = page.locator("[data-testid='template-card']").first();
    if (await firstTemplate.isVisible()) {
      await firstTemplate.locator("a").click();
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-testid='report-button']")).toBeVisible();
    }
  });
});
