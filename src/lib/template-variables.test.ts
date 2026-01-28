import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  substituteTemplateVariables,
  parseTemplateVariables,
  getSupportedVariables,
  isKnownVariable,
  type TemplateContext,
} from "./template-variables";

describe("template-variables", () => {
  describe("substituteTemplateVariables", () => {
    const fullContext: TemplateContext = {
      repTitle: "Senator",
      repName: "Jane Doe",
      repFirst: "Jane",
      repLast: "Doe",
      repParty: "D",
      state: "CA",
      district: "12",
      userName: "John Smith",
      userCity: "San Francisco",
    };

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-27"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("substitutes REP_TITLE correctly", () => {
      const result = substituteTemplateVariables("Dear {{REP_TITLE}}", fullContext);
      expect(result).toBe("Dear Senator");
    });

    it("substitutes REP_NAME correctly", () => {
      const result = substituteTemplateVariables("Dear {{REP_NAME}}", fullContext);
      expect(result).toBe("Dear Jane Doe");
    });

    it("substitutes REP_FIRST correctly", () => {
      const result = substituteTemplateVariables("Dear {{REP_FIRST}}", fullContext);
      expect(result).toBe("Dear Jane");
    });

    it("substitutes REP_LAST correctly", () => {
      const result = substituteTemplateVariables("Dear {{REP_LAST}}", fullContext);
      expect(result).toBe("Dear Doe");
    });

    it("substitutes REP_PARTY correctly", () => {
      const result = substituteTemplateVariables("Party: {{REP_PARTY}}", fullContext);
      expect(result).toBe("Party: D");
    });

    it("substitutes STATE correctly", () => {
      const result = substituteTemplateVariables("State: {{STATE}}", fullContext);
      expect(result).toBe("State: CA");
    });

    it("substitutes DISTRICT correctly", () => {
      const result = substituteTemplateVariables("District: {{DISTRICT}}", fullContext);
      expect(result).toBe("District: 12");
    });

    it("substitutes USER_NAME correctly", () => {
      const result = substituteTemplateVariables("Signed, {{USER_NAME}}", fullContext);
      expect(result).toBe("Signed, John Smith");
    });

    it("substitutes USER_CITY correctly", () => {
      const result = substituteTemplateVariables("From {{USER_CITY}}", fullContext);
      expect(result).toBe("From San Francisco");
    });

    it("substitutes TODAY_DATE correctly", () => {
      const result = substituteTemplateVariables("Date: {{TODAY_DATE}}", fullContext);
      expect(result).toMatch(/^Date: \w+ \d{1,2}, \d{4}$/);
    });

    it("handles multiple occurrences of same variable", () => {
      const content = "{{REP_NAME}} is great. Thank you, {{REP_NAME}}!";
      const result = substituteTemplateVariables(content, fullContext);
      expect(result).toBe("Jane Doe is great. Thank you, Jane Doe!");
    });

    it("handles multiple different variables", () => {
      const content = "Dear {{REP_TITLE}} {{REP_NAME}}, I live in {{STATE}}.";
      const result = substituteTemplateVariables(content, fullContext);
      expect(result).toBe("Dear Senator Jane Doe, I live in CA.");
    });

    it("leaves unknown variables unchanged", () => {
      const content = "Hello {{UNKNOWN_VAR}}!";
      const result = substituteTemplateVariables(content, fullContext);
      expect(result).toBe("Hello {{UNKNOWN_VAR}}!");
    });

    it("keeps unsubstituted variables when context is missing", () => {
      const content = "Dear {{REP_NAME}}, my name is {{USER_NAME}}.";
      const result = substituteTemplateVariables(content, {
        repName: "Jane Doe",
      });
      expect(result).toBe("Dear Jane Doe, my name is {{USER_NAME}}.");
    });

    it("handles empty content", () => {
      const result = substituteTemplateVariables("", fullContext);
      expect(result).toBe("");
    });

    it("handles content with no variables", () => {
      const content = "This is plain text.";
      const result = substituteTemplateVariables(content, fullContext);
      expect(result).toBe("This is plain text.");
    });
  });

  describe("parseTemplateVariables", () => {
    it("extracts single variable", () => {
      const vars = parseTemplateVariables("Hello {{REP_NAME}}!");
      expect(vars).toEqual(["REP_NAME"]);
    });

    it("extracts multiple variables", () => {
      const vars = parseTemplateVariables("{{REP_TITLE}} {{REP_NAME}} in {{STATE}}");
      expect(vars).toEqual(["REP_TITLE", "REP_NAME", "STATE"]);
    });

    it("deduplicates repeated variables", () => {
      const vars = parseTemplateVariables("{{REP_NAME}} and {{REP_NAME}}");
      expect(vars).toEqual(["REP_NAME"]);
    });

    it("returns empty array for no variables", () => {
      const vars = parseTemplateVariables("No variables here.");
      expect(vars).toEqual([]);
    });

    it("handles empty content", () => {
      const vars = parseTemplateVariables("");
      expect(vars).toEqual([]);
    });
  });

  describe("getSupportedVariables", () => {
    it("returns all supported variables", () => {
      const vars = getSupportedVariables();
      expect(vars).toContain("REP_TITLE");
      expect(vars).toContain("REP_NAME");
      expect(vars).toContain("REP_FIRST");
      expect(vars).toContain("REP_LAST");
      expect(vars).toContain("REP_PARTY");
      expect(vars).toContain("STATE");
      expect(vars).toContain("DISTRICT");
      expect(vars).toContain("USER_NAME");
      expect(vars).toContain("USER_CITY");
      expect(vars).toContain("TODAY_DATE");
    });
  });

  describe("isKnownVariable", () => {
    it("returns true for known variables", () => {
      expect(isKnownVariable("REP_NAME")).toBe(true);
      expect(isKnownVariable("TODAY_DATE")).toBe(true);
    });

    it("returns false for unknown variables", () => {
      expect(isKnownVariable("UNKNOWN")).toBe(false);
      expect(isKnownVariable("")).toBe(false);
    });
  });
});
