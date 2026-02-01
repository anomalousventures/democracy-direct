import { describe, it, expect } from "vitest";
import { SEED_TEMPLATES, hashContent, type SeedTemplate } from "./seed-templates";
import { getSupportedVariables } from "@/lib/template-variables";

describe("seed-templates", () => {
  describe("SEED_TEMPLATES", () => {
    it("has at least one template", () => {
      expect(SEED_TEMPLATES.length).toBeGreaterThan(0);
    });

    it("all templates have required fields", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.title).toBeTruthy();
        expect(template.body).toBeTruthy();
        expect(Array.isArray(template.issueTags)).toBe(true);
        expect(template.issueTags.length).toBeGreaterThan(0);
      }
    });

    it("all templates have unique titles", () => {
      const titles = SEED_TEMPLATES.map((t) => t.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it("all templates use only valid template variables", () => {
      const validVars = new Set(getSupportedVariables());
      const varPattern = /\{\{(\w+)\}\}/g;

      for (const template of SEED_TEMPLATES) {
        const matches = template.body.matchAll(varPattern);
        for (const match of matches) {
          const varName = match[1];
          expect(validVars.has(varName)).toBe(true);
        }
      }
    });

    it("all templates contain REP_TITLE and REP_LAST placeholders", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.body).toContain("{{REP_TITLE}}");
        expect(template.body).toContain("{{REP_LAST}}");
      }
    });

    it("all templates contain USER_NAME placeholder", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.body).toContain("{{USER_NAME}}");
      }
    });

    it("all templates have reasonable title length", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.title.length).toBeLessThanOrEqual(200);
        expect(template.title.length).toBeGreaterThan(10);
      }
    });

    it("all issue tags are lowercase with hyphens", () => {
      const tagPattern = /^[a-z][a-z0-9-]*$/;
      for (const template of SEED_TEMPLATES) {
        for (const tag of template.issueTags) {
          expect(tag).toMatch(tagPattern);
        }
      }
    });
  });

  describe("hashContent", () => {
    it("returns a 64-character hex string", () => {
      const hash = hashContent("test content");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it("returns consistent hash for same input", () => {
      const hash1 = hashContent("hello world");
      const hash2 = hashContent("hello world");
      expect(hash1).toBe(hash2);
    });

    it("returns different hash for different input", () => {
      const hash1 = hashContent("hello world");
      const hash2 = hashContent("hello world!");
      expect(hash1).not.toBe(hash2);
    });

    it("handles empty string", () => {
      const hash = hashContent("");
      expect(hash).toHaveLength(64);
    });

    it("handles unicode content", () => {
      const hash = hashContent("Hello 世界 🌍");
      expect(hash).toHaveLength(64);
    });
  });

  describe("SeedTemplate interface", () => {
    it("accepts valid template objects", () => {
      const validTemplate: SeedTemplate = {
        title: "Test Title",
        description: "Test description",
        body: "Test body with {{REP_TITLE}}",
        issueTags: ["test-tag"],
      };
      expect(validTemplate.title).toBe("Test Title");
    });
  });

  describe("SEED_TEMPLATES descriptions", () => {
    it("all templates have descriptions", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.description).toBeTruthy();
      }
    });

    it("all descriptions are within 200 character limit", () => {
      for (const template of SEED_TEMPLATES) {
        expect(template.description.length).toBeLessThanOrEqual(200);
      }
    });
  });
});
