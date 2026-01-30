import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateShareUrls,
  generateTwitterUrl,
  generateEmailUrl,
  generateTemplateShareText,
  generateRepShareText,
  supportsWebShare,
  triggerWebShare,
} from "./share";

describe("share utilities", () => {
  describe("generateShareUrls", () => {
    it("generates all platform URLs", () => {
      const urls = generateShareUrls({
        url: "https://example.com/page",
        title: "Test Title",
        description: "Test description",
      });

      expect(urls.twitter).toContain("twitter.com/intent/tweet");
      expect(urls.facebook).toContain("facebook.com/sharer/sharer.php");
      expect(urls.reddit).toContain("reddit.com/submit");
      expect(urls.email).toMatch(/^mailto:/);
    });

    it("properly encodes URL with special characters", () => {
      const urls = generateShareUrls({
        url: "https://example.com/page?foo=bar&baz=qux",
        title: "Test & Title",
      });

      expect(urls.twitter).toContain(
        encodeURIComponent("https://example.com/page?foo=bar&baz=qux")
      );
      expect(urls.facebook).toContain(
        encodeURIComponent("https://example.com/page?foo=bar&baz=qux")
      );
    });
  });

  describe("generateTwitterUrl", () => {
    it("creates correct Twitter intent URL", () => {
      const url = generateTwitterUrl("https://example.com", "Check out this page");

      expect(url).toBe(
        "https://twitter.com/intent/tweet?text=Check%20out%20this%20page&url=https%3A%2F%2Fexample.com"
      );
    });

    it("handles special characters in text", () => {
      const url = generateTwitterUrl("https://example.com", 'Test "quoted" & special');

      expect(url).toContain(encodeURIComponent('Test "quoted" & special'));
    });
  });

  describe("generateEmailUrl", () => {
    it("creates mailto link with subject and body", () => {
      const url = generateEmailUrl("Email Subject", "Email body text", "https://example.com");

      expect(url).toMatch(/^mailto:\?subject=/);
      expect(url).toContain(encodeURIComponent("Email Subject"));
      expect(url).toContain(encodeURIComponent("Email body text"));
      expect(url).toContain(encodeURIComponent("https://example.com"));
    });

    it("appends URL to body on new line", () => {
      const url = generateEmailUrl("Subject", "Body", "https://example.com");
      const bodyParam = url.split("body=")[1];
      const decodedBody = decodeURIComponent(bodyParam);

      expect(decodedBody).toBe("Body\n\nhttps://example.com");
    });
  });

  describe("generateTemplateShareText", () => {
    it("generates template-specific share text", () => {
      const text = generateTemplateShareText("Healthcare Access Letter");

      expect(text).toBe(
        'Check out this letter template for contacting Congress: "Healthcare Access Letter"'
      );
    });
  });

  describe("generateRepShareText", () => {
    it("generates rep-specific share text", () => {
      const text = generateRepShareText("Jane Smith", "D", "CA");

      expect(text).toBe("Contact Jane Smith (D-CA) about issues that matter to you:");
    });
  });

  describe("supportsWebShare", () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("returns false when navigator is undefined", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        writable: true,
      });

      expect(supportsWebShare()).toBe(false);
    });

    it("returns false when share is not a function", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { share: undefined },
        writable: true,
      });

      expect(supportsWebShare()).toBe(false);
    });

    it("returns true when share is available", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { share: () => Promise.resolve() },
        writable: true,
      });

      expect(supportsWebShare()).toBe(true);
    });
  });

  describe("triggerWebShare", () => {
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: { share: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("returns false when Web Share is not supported", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { share: undefined },
        writable: true,
      });

      const result = await triggerWebShare({
        url: "https://example.com",
        title: "Test",
      });

      expect(result).toBe(false);
    });

    it("calls navigator.share with correct params", async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, "navigator", {
        value: { share: mockShare },
        writable: true,
      });

      await triggerWebShare({
        url: "https://example.com",
        title: "Test Title",
        description: "Test Description",
      });

      expect(mockShare).toHaveBeenCalledWith({
        title: "Test Title",
        text: "Test Description",
        url: "https://example.com",
      });
    });

    it("returns true on successful share", async () => {
      const result = await triggerWebShare({
        url: "https://example.com",
        title: "Test",
      });

      expect(result).toBe(true);
    });

    it("returns true when user cancels (AbortError)", async () => {
      const abortError = new Error("User cancelled");
      abortError.name = "AbortError";

      Object.defineProperty(globalThis, "navigator", {
        value: { share: vi.fn().mockRejectedValue(abortError) },
        writable: true,
      });

      const result = await triggerWebShare({
        url: "https://example.com",
        title: "Test",
      });

      expect(result).toBe(true);
    });

    it("returns false on other errors", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { share: vi.fn().mockRejectedValue(new Error("Share failed")) },
        writable: true,
      });

      const result = await triggerWebShare({
        url: "https://example.com",
        title: "Test",
      });

      expect(result).toBe(false);
    });
  });
});
