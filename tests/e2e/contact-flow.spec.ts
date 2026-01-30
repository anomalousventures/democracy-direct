import { test, expect, type Page } from "@playwright/test";

// Jimmy Patronis - has contact_form_url for testing contact form flow
const REP_PAGE = "/rep/P000622";

async function fillComposer(page: Page, text: string) {
  await page.waitForLoadState("networkidle");
  const composer = page.getByTestId("tiptap-editor");
  await composer.click();
  await composer.pressSequentially(text, { delay: 10 });
  await expect(page.getByTestId("character-count")).toHaveText(String(text.length), {
    timeout: 5000,
  });
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
      const preview = page.getByTestId("letter-preview");
      await expect(preview).toContainText(/Dear Representative Patronis/i);
    });
  });

  test.describe("3.2 Clipboard Copy", () => {
    test("copy button exists after typing", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test content");
      const copyButton = page.getByRole("button", { name: /copy letter/i });
      await expect(copyButton).toBeVisible();
    });

    test("clicking copy shows success toast", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const copyButton = page.getByRole("button", { name: /copy letter/i });
      await copyButton.click();
      await expect(page.getByText(/copied/i)).toBeVisible();
    });
  });

  test.describe("3.3 Contact Form Flow", () => {
    test("contact form button triggers copy and opens new tab", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const contactFormButton = page.getByRole("button", { name: /contact form/i });
      await expect(contactFormButton).toBeVisible();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        contactFormButton.click(),
      ]);
      expect(newPage).toBeTruthy();
      await newPage.close();
    });

    test("toast message appears after contact form action", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-write"]);
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test letter");
      const contactFormButton = page.getByRole("button", { name: /contact form/i });
      await contactFormButton.click();
      await expect(page.getByText(/copied|paste/i)).toBeVisible();
    });
  });

  test.describe("3.4 Print Letter", () => {
    test("print button exists after typing", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test content");
      const printButton = page.getByRole("button", { name: /print/i });
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

    test("return address fields are editable", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test");
      const nameInput = page.locator("#address-name");
      const streetInput = page.locator("#address-street");
      await nameInput.fill("Jane Doe");
      await streetInput.fill("456 Main St");
      await expect(nameInput).toHaveValue("Jane Doe");
      await expect(streetInput).toHaveValue("456 Main St");
    });
  });

  test.describe("3.5 Print Address Form", () => {
    test("address fields exist and are editable", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test");
      await expect(page.locator("#address-name")).toBeVisible();
      await expect(page.locator("#address-street")).toBeVisible();
      await expect(page.locator("#address-city")).toBeVisible();
      await expect(page.locator("#address-state")).toBeVisible();
      await expect(page.locator("#address-zip")).toBeVisible();
    });

    test("values persist after page reload when opt-in enabled", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test");

      // Enable localStorage persistence
      const saveCheckbox = page.getByRole("checkbox", { name: /remember my address/i });
      await saveCheckbox.check();

      const nameInput = page.locator("#address-name");
      await nameInput.fill("John Smith");
      const cityInput = page.locator("#address-city");
      await cityInput.fill("Los Angeles");

      await page.reload();
      await fillComposer(page, "Test");
      await expect(page.locator("#address-name")).toHaveValue("John Smith");
      await expect(page.locator("#address-city")).toHaveValue("Los Angeles");
    });

    test("clear button removes stored values", async ({ page }) => {
      await page.goto(REP_PAGE);
      await fillComposer(page, "Test");
      const nameInput = page.locator("#address-name");
      await nameInput.fill("Test User");
      const clearButton = page.getByRole("button", { name: /clear/i });
      await clearButton.click();
      await expect(nameInput).toHaveValue("");
    });
  });
});
