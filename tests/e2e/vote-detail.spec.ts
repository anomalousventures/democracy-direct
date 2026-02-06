import { test, expect } from "@playwright/test";
import { E2E_VOTE } from "./global-setup";

const VOTE_URL = "/vote/house/119/1/9999";

test.describe("Vote Detail Page", () => {
  test("page loads with vote data", async ({ page }) => {
    const response = await page.goto(VOTE_URL);
    expect(response?.status()).toBe(200);

    await expect(page.locator("[data-testid='vote-detail']")).toBeVisible();
  });

  test("displays roll call number and result", async ({ page }) => {
    await page.goto(VOTE_URL);

    const rollCall = page.locator("[data-testid='vote-roll-call']");
    await expect(rollCall).toBeVisible();
    await expect(rollCall).toContainText("Roll Call #9999");

    const result = page.locator("[data-testid='vote-result']");
    await expect(result).toBeVisible();
    await expect(result).toContainText(E2E_VOTE.result);
  });

  test("displays vote stats bar with correct counts", async ({ page }) => {
    await page.goto(VOTE_URL);

    const statsBar = page.locator("[data-testid='vote-stats-bar']");
    await expect(statsBar).toBeVisible();

    await expect(statsBar).toContainText(`${E2E_VOTE.yeas}`);
    await expect(statsBar).toContainText(`${E2E_VOTE.nays}`);
  });

  test("displays member vote list with filters", async ({ page }) => {
    await page.goto(VOTE_URL);

    const memberList = page.locator("[data-testid='member-vote-list']");
    await expect(memberList).toBeVisible();

    const allButton = memberList.getByRole("button", { name: "All" });
    await expect(allButton).toBeVisible();
  });

  test("shows back link to associated bill", async ({ page }) => {
    await page.goto(VOTE_URL);

    const backLink = page.locator(".link-back");
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText("H.R.9999");
  });

  test("displays question text", async ({ page }) => {
    await page.goto(VOTE_URL);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(E2E_VOTE.question);
  });

  test("shows template CTA buttons for linked bill", async ({ page }) => {
    await page.goto(VOTE_URL);

    await expect(page.getByRole("link", { name: /browse templates/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /write a template/i })).toBeVisible();
  });

  test("returns 404 for invalid vote URL format", async ({ page }) => {
    const response = await page.goto("/vote/house/119");
    expect(response?.status()).toBe(404);
  });

  test("returns 404 for non-existent vote", async ({ page }) => {
    const response = await page.goto("/vote/house/119/1/88888");
    expect(response?.status()).toBe(404);
  });

  test("returns 404 for invalid chamber", async ({ page }) => {
    const response = await page.goto("/vote/invalid/119/1/9999");
    expect(response?.status()).toBe(404);
  });
});
