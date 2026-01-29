import { describe, it, expect } from "vitest";
import { SESSION_DURATION_DAYS, SAMPLE_TEMPLATES, E2E_TAG_NAME } from "./seed-e2e";

describe("seed-e2e constants", () => {
  describe("SESSION_DURATION_DAYS", () => {
    it("is a positive number", () => {
      expect(SESSION_DURATION_DAYS).toBeGreaterThan(0);
    });

    it("is 30 days", () => {
      expect(SESSION_DURATION_DAYS).toBe(30);
    });
  });

  describe("SAMPLE_TEMPLATES", () => {
    it("has at least one template", () => {
      expect(SAMPLE_TEMPLATES.length).toBeGreaterThan(0);
    });

    it("all templates have required fields", () => {
      for (const template of SAMPLE_TEMPLATES) {
        expect(template.slug).toBeTruthy();
        expect(template.title).toBeTruthy();
        expect(template.body).toBeTruthy();
        expect(Array.isArray(template.issueTags)).toBe(true);
        expect(template.issueTags.length).toBeGreaterThan(0);
      }
    });

    it("all templates have e2e prefix in slug", () => {
      for (const template of SAMPLE_TEMPLATES) {
        expect(template.slug).toMatch(/^e2e-/);
      }
    });

    it("all templates contain required placeholders", () => {
      const requiredPlaceholders = ["{{REP_TITLE}}", "{{REP_LAST}}", "{{USER_NAME}}"];

      for (const template of SAMPLE_TEMPLATES) {
        for (const placeholder of requiredPlaceholders) {
          expect(template.body).toContain(placeholder);
        }
      }
    });

    it("templates have unique slugs", () => {
      const slugs = SAMPLE_TEMPLATES.map((t) => t.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe("E2E_TAG_NAME", () => {
    it("is a non-empty string", () => {
      expect(E2E_TAG_NAME).toBeTruthy();
      expect(typeof E2E_TAG_NAME).toBe("string");
    });

    it("has e2e prefix", () => {
      expect(E2E_TAG_NAME).toMatch(/^e2e-/);
    });
  });
});
