---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Add E2E Tests for District Map

## Description

Create end-to-end tests that verify the map page loads correctly, the map canvas renders, navigation links work, and the loading experience is smooth.

## Background

E2E tests for map features are necessarily limited since we can't easily simulate map clicks or verify GeoJSON rendering in Playwright. The tests should focus on verifiable page-level behaviors: navigation, page loading, component mounting, and the presence of key UI elements. TIGERweb API calls may fail in CI, so tests should handle that gracefully.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Verification section)

**Additional References:**

- Existing E2E test patterns: tests/e2e/
- Playwright configuration

## Technical Requirements

1. Create `tests/e2e/district-map.spec.ts`
2. Test the map page loads at `/map`
3. Test the map canvas element renders (MapLibre creates a `<canvas>`)
4. Test the map link exists in the main navigation
5. Test the loading skeleton appears and then resolves
6. Test page title and meta description are correct
7. Test attribution text is present
8. Handle TIGERweb failures gracefully in tests (map may show error state in CI)

## Dependencies

- task-04 (map page)
- task-05 (navigation link)

## Implementation Approach

1. Create `tests/e2e/district-map.spec.ts`:

   ```typescript
   test("map page loads", async ({ page }) => {
     await page.goto("/map");
     await expect(page).toHaveTitle(/District Map/);
   });

   test("map canvas renders", async ({ page }) => {
     await page.goto("/map");
     // MapLibre creates a canvas element
     const canvas = page.locator("canvas");
     await expect(canvas).toBeVisible({ timeout: 15000 });
   });

   test("navigation contains map link", async ({ page }) => {
     await page.goto("/");
     const mapLink = page.locator('nav a[href="/map"]');
     await expect(mapLink).toBeVisible();
   });

   test("attribution is displayed", async ({ page }) => {
     await page.goto("/map");
     await expect(page.getByText(/Stadia Maps/)).toBeVisible();
     await expect(page.getByText(/Census Bureau/)).toBeVisible();
   });
   ```

2. Use generous timeouts for map rendering (MapLibre + TIGERweb fetch can be slow)
3. Don't test map click interactions (unreliable in E2E, covered by unit tests)
4. Test that error state renders correctly if TIGERweb is unavailable (optional, may be flaky)

## Acceptance Criteria

1. **Map page loads**
   - Given the E2E test navigates to `/map`
   - When the page loads
   - Then the page title contains "District Map"

2. **Canvas renders**
   - Given the map page loads
   - When MapLibre initializes
   - Then a `<canvas>` element is visible on the page

3. **Navigation link present**
   - Given the E2E test visits the homepage
   - When the navigation is inspected
   - Then a link to `/map` exists

4. **Loading resolves**
   - Given the map page is loading
   - When the map component hydrates
   - Then the loading skeleton is replaced by the map (or error state)

5. **Attribution visible**
   - Given the map page renders
   - When text content is checked
   - Then Stadia Maps and Census Bureau attributions are visible

6. **Tests pass**
   - Given the E2E test suite
   - When `pnpm test:e2e` runs
   - Then the district-map tests pass

## Metadata

- **Complexity**: Medium
- **Labels**: e2e, testing, playwright, district-map
- **Required Skills**: Playwright, E2E testing
