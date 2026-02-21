import { test, expect } from "@playwright/test";

const REP_PAGE = "/rep/P000622";

test.describe("Representative Profile Page", () => {
  test.describe("tabs navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(REP_PAGE);
      await page.getByRole("tab", { name: /Contact/i }).waitFor({ state: "visible" });
    });

    test("displays all three tabs", async ({ page }) => {
      const contactTab = page.getByRole("tab", { name: /Contact/i });
      const votesTab = page.getByRole("tab", { name: /Voting Record/i });
      const billsTab = page.getByRole("tab", { name: /Sponsored Bills/i });

      await expect(contactTab).toBeVisible();
      await expect(votesTab).toBeVisible();
      await expect(billsTab).toBeVisible();
    });

    test("contact tab is selected by default", async ({ page }) => {
      const contactTab = page.getByRole("tab", { name: /Contact/i });
      await expect(contactTab).toHaveAttribute("aria-selected", "true");
    });

    test("shows contact information by default", async ({ page }) => {
      const contactInfo = page.getByText("Contact Information");
      await expect(contactInfo).toBeVisible();
    });

    test("switches to voting record tab when clicked", async ({ page }) => {
      const votesTab = page.getByRole("tab", { name: /Voting Record/i });
      await votesTab.click();

      await expect(votesTab).toHaveAttribute("aria-selected", "true");

      const votingPanel = page.getByRole("tabpanel");
      await expect(votingPanel).toBeVisible();
    });

    test("switches to sponsored bills tab when clicked", async ({ page }) => {
      const billsTab = page.getByRole("tab", { name: /Sponsored Bills/i });
      await billsTab.click();

      await expect(billsTab).toHaveAttribute("aria-selected", "true");

      const billsPanel = page.getByRole("tabpanel");
      await expect(billsPanel).toBeVisible();
    });

    test("preserves tab selection via URL hash", async ({ page }) => {
      await page.goto(`${REP_PAGE}#votes`);

      const votesTab = page.getByRole("tab", { name: /Voting Record/i });
      await expect(votesTab).toBeVisible();
      await expect(votesTab).toHaveAttribute("aria-selected", "true");
    });

    test("preserves bills tab selection via URL hash", async ({ page }) => {
      await page.goto(`${REP_PAGE}#bills`);

      const billsTab = page.getByRole("tab", { name: /Sponsored Bills/i });
      await expect(billsTab).toBeVisible();
      await expect(billsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test("shows error for invalid bioguide ID format (too short)", async ({ page }) => {
    await page.goto("/rep/invalid");
    const error = page.getByText(/invalid representative|not found/i);
    await expect(error).toBeVisible();
  });

  test("shows error for invalid bioguide ID format (numbers only)", async ({ page }) => {
    await page.goto("/rep/1234567");
    const error = page.getByText(/invalid representative|not found/i);
    await expect(error).toBeVisible();
  });

  test("displays find representatives button on error", async ({ page }) => {
    await page.goto("/rep/invalid");
    const findRepsButton = page.getByRole("link", {
      name: /find.*representatives/i,
    });
    await expect(findRepsButton).toBeVisible();
    await expect(findRepsButton).toHaveAttribute("href", "/");
  });

  test("page renders for valid format bioguide ID", async ({ page }) => {
    const response = await page.goto("/rep/A000360");
    expect(response?.status()).toBeLessThan(500);
  });

  test("header navigation is present", async ({ page }) => {
    await page.goto("/rep/A000360");
    const logo = page.getByRole("link", { name: /democracy direct/i });
    await expect(logo).toBeVisible();
  });

  test("about link in header works", async ({ page }) => {
    await page.goto("/rep/A000360");
    const aboutLink = page.locator("header").getByRole("link", { name: /about/i });
    await expect(aboutLink).toBeVisible();
    await expect(aboutLink).toHaveAttribute("href", "/about");
  });
});
