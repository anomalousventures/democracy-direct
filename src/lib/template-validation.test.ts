import { describe, it, expect } from "vitest";
import {
  validateTemplateTitle,
  validateTemplateBody,
  validateTemplate,
  generateSlug,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  BODY_MIN_LENGTH,
  BODY_MAX_LENGTH,
} from "./template-validation";

describe("template-validation", () => {
  describe("validateTemplateTitle", () => {
    it("passes valid title", () => {
      const errors = validateTemplateTitle("Support for Climate Action");
      expect(errors).toHaveLength(0);
    });

    it("fails empty title", () => {
      const errors = validateTemplateTitle("");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("title");
      expect(errors[0].message).toContain("required");
    });

    it("fails too short title", () => {
      const errors = validateTemplateTitle("Hi");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain(`${TITLE_MIN_LENGTH}`);
    });

    it("fails too long title", () => {
      const errors = validateTemplateTitle("This is a title that ".repeat(10));
      expect(errors.some((e) => e.message.includes(`${TITLE_MAX_LENGTH}`))).toBe(true);
    });

    it("fails all caps title", () => {
      const errors = validateTemplateTitle("SUPPORT CLIMATE ACTION NOW");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("caps");
    });

    it("allows mixed case title", () => {
      const errors = validateTemplateTitle("SUPPORT Climate Action");
      expect(errors).toHaveLength(0);
    });
  });

  describe("validateTemplateBody", () => {
    const validBody =
      "This is a valid template body that is long enough to pass the minimum character requirement for template submissions.";

    it("passes valid body", () => {
      const errors = validateTemplateBody(validBody);
      expect(errors).toHaveLength(0);
    });

    it("fails empty body", () => {
      const errors = validateTemplateBody("");
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("body");
      expect(errors[0].message).toContain("required");
    });

    it("fails too short body", () => {
      const errors = validateTemplateBody("Too short.");
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain(`${BODY_MIN_LENGTH}`);
    });

    it("fails too long body", () => {
      const errors = validateTemplateBody("A".repeat(BODY_MAX_LENGTH + 1));
      expect(errors.some((e) => e.message.includes(`${BODY_MAX_LENGTH}`))).toBe(true);
    });

    it("fails spam patterns - buy now", () => {
      const spamBody = validBody + " Buy now for limited time offer!";
      const errors = validateTemplateBody(spamBody);
      expect(errors.some((e) => e.message.includes("spam"))).toBe(true);
    });

    it("fails spam patterns - repeated characters", () => {
      const spamBody = validBody + " Pleaseeeeeeeeee help!";
      const errors = validateTemplateBody(spamBody);
      expect(errors.some((e) => e.message.includes("spam"))).toBe(true);
    });

    it("fails spam patterns - money symbols", () => {
      const spamBody = validBody + " Save $$$ now!";
      const errors = validateTemplateBody(spamBody);
      expect(errors.some((e) => e.message.includes("spam"))).toBe(true);
    });
  });

  describe("validateTemplate", () => {
    const validInput = {
      title: "Support for Climate Action",
      body: "This is a valid template body that is long enough to pass the minimum character requirement for template submissions.",
    };

    it("passes valid input", () => {
      const errors = validateTemplate(validInput);
      expect(errors).toHaveLength(0);
    });

    it("collects errors from both title and body", () => {
      const errors = validateTemplate({
        title: "",
        body: "",
      });
      expect(errors.length).toBeGreaterThan(1);
      expect(errors.some((e) => e.field === "title")).toBe(true);
      expect(errors.some((e) => e.field === "body")).toBe(true);
    });
  });

  describe("generateSlug", () => {
    it("generates slug from title", () => {
      const slug = generateSlug("Support for Climate Action");
      expect(slug).toMatch(/^support-for-climate-action-[a-z0-9]+$/);
    });

    it("removes special characters", () => {
      const slug = generateSlug("What's Next? A Call to Action!");
      expect(slug).toMatch(/^whats-next-a-call-to-action-[a-z0-9]+$/);
    });

    it("handles multiple spaces", () => {
      const slug = generateSlug("Hello    World");
      expect(slug).toContain("hello-world");
    });

    it("truncates long titles", () => {
      const longTitle = "A".repeat(100);
      const slug = generateSlug(longTitle);
      expect(slug.split("-")[0].length).toBeLessThanOrEqual(50);
    });

    it("generates unique slugs for same title", () => {
      const slug1 = generateSlug("Same Title");
      const slug2 = generateSlug("Same Title");
      expect(slug1).not.toBe(slug2);
    });
  });
});
