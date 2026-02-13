import { test, expect, type Page } from "@playwright/test";

// Jimmy Patronis - has contact_form_url for testing contact form flow
const REP_PAGE = "/rep/P000622";

async function fillComposer(page: Page, text: string) {
  await page.waitForLoadState("networkidle");
  const composer = page.getByTestId("tiptap-editor");
  await expect(composer).toHaveAttribute("data-editor-ready", "true", { timeout: 5000 });

  await expect(async () => {
    await composer.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText(text);
    await expect(page.getByTestId("character-count")).toHaveText(String(text.length));
  }).toPass({ timeout: 10000 });
}

test.describe("Phase 3: Contact Flow", () => {
  test.describe("3.1 Letter Composer", () => {
    test("can type in composer", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Dear Representative, I am writing.");
      const composer = page.getByTestId("tiptap-editor");
      await expect(composer).toContainText("Dear Representative, I am writing.");
    });

    test("character count updates", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Hello");
      await expect(page.getByText(/5 characters/)).toBeVisible();
    });

    test("variable substitution shows preview", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Dear {{REP_TITLE}} {{REP_LAST}},");
      const preview = page.getByTestId("print-preview").first();
      await expect(preview).toContainText(/Dear Representative Patronis/i);
    });
  });

  test.describe("3.2 Clipboard Copy", () => {
    test("copy button exists after typing", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test content");
      const copyButton = page.getByRole("button", { name: /^copy$/i });
      await expect(copyButton).toBeVisible();
    });

    test("clicking copy shows success toast", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const copyButton = page.getByRole("button", { name: /^copy$/i });
      await copyButton.click();
      await expect(page.getByText(/copied/i)).toBeVisible();
    });
  });

  test.describe("3.3 Contact Form Flow", () => {
    test("contact form button copies letter and shows dialog", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const contactFormButton = page.getByRole("button", { name: /send via contact form/i });
      await expect(contactFormButton).toBeVisible();
      await contactFormButton.click();
      await expect(page.getByText(/letter copied to clipboard/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /go to contact form/i })).toBeVisible();
    });

    test("dialog link opens contact form in new tab", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const contactFormButton = page.getByRole("button", { name: /send via contact form/i });
      await contactFormButton.click();
      await expect(page.getByText(/letter copied to clipboard/i)).toBeVisible();
      const goToFormLink = page.getByRole("link", { name: /go to contact form/i });
      const [newPage] = await Promise.all([context.waitForEvent("page"), goToFormLink.click()]);
      expect(newPage).toBeTruthy();
      await newPage.close();
    });
  });

  test.describe("3.4 Print Letter", () => {
    test("print button exists after typing", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test content");
      const printButton = page.getByRole("button", { name: /print & mail/i });
      await expect(printButton).toBeVisible();
    });

    test("print preview contains all sections", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "This is my letter.");
      const preview = page.getByTestId("print-preview").first();
      const today = new Date();
      const month = today.toLocaleDateString("en-US", { month: "long" });
      await expect(preview).toContainText(month);
      await expect(preview).toContainText("This is my letter.");
      await expect(preview).toContainText(/Jimmy Patronis/);
    });

    test("sender info fields are editable", async ({ page }) => {
      await page.goto(REP_PAGE);
      const nameInput = page.locator("#sender-name");
      const streetInput = page.locator("#sender-street");
      await nameInput.fill("Jane Doe");
      await streetInput.fill("456 Main St");
      await expect(nameInput).toHaveValue("Jane Doe");
      await expect(streetInput).toHaveValue("456 Main St");
    });
  });

  test.describe("3.5 Sender Info Form", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page }) => {
      await page.goto(REP_PAGE);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    test("sender info fields exist and are editable", async ({ page }) => {
      await expect(page.locator("#sender-name")).toBeVisible();
      await expect(page.locator("#sender-street")).toBeVisible();
      await expect(page.locator("#sender-city")).toBeVisible();
      await expect(page.locator("#sender-state")).toBeVisible();
      await expect(page.locator("#sender-zip")).toBeVisible();
    });

    test("values persist after page reload when opt-in enabled", async ({ page }) => {
      const saveCheckbox = page.getByRole("checkbox", { name: /remember on this device/i });
      await saveCheckbox.check();

      const nameInput = page.locator("#sender-name");
      await nameInput.fill("John Smith");
      const cityInput = page.locator("#sender-city");
      await cityInput.fill("Los Angeles");

      await page.waitForTimeout(500);
      await page.reload();
      await expect(page.locator("#sender-name")).toHaveValue("John Smith");
      await expect(page.locator("#sender-city")).toHaveValue("Los Angeles");
    });

    test("clear button removes field values", async ({ page }) => {
      const nameInput = page.locator("#sender-name");
      await nameInput.fill("Test User");
      await expect(nameInput).toHaveValue("Test User");
      const yourInfoSection = page.locator("h3", { hasText: "Your Information" }).locator("..");
      const clearButton = yourInfoSection.getByRole("button", { name: /clear/i });
      await expect(clearButton).toBeVisible();
      await clearButton.click();
      await expect(nameInput).toHaveValue("", { timeout: 10000 });
    });
  });
});
