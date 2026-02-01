import { describe, it, expect } from "vitest";
import { generateSitemapXml, formatDate, type SitemapEntry } from "./sitemap";

describe("sitemap", () => {
  describe("formatDate", () => {
    it("returns YYYY-MM-DD format", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      expect(formatDate(date)).toBe("2024-03-15");
    });

    it("handles different dates correctly", () => {
      expect(formatDate(new Date("2023-01-01T00:00:00Z"))).toBe("2023-01-01");
      expect(formatDate(new Date("2025-12-31T23:59:59Z"))).toBe("2025-12-31");
    });
  });

  describe("generateSitemapXml", () => {
    it("generates valid XML with proper structure", () => {
      const entries: SitemapEntry[] = [{ loc: "/" }];
      const xml = generateSitemapXml(entries);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xml).toContain("<urlset");
      expect(xml).toContain("</urlset>");
    });

    it("includes loc for all entries", () => {
      const entries: SitemapEntry[] = [{ loc: "/" }, { loc: "/about" }, { loc: "/rep/A000123" }];
      const xml = generateSitemapXml(entries);

      expect(xml).toContain("<loc>https://democracy-direct.com/</loc>");
      expect(xml).toContain("<loc>https://democracy-direct.com/about</loc>");
      expect(xml).toContain("<loc>https://democracy-direct.com/rep/A000123</loc>");
    });

    it("includes optional fields when provided", () => {
      const entries: SitemapEntry[] = [
        {
          loc: "/templates/test-template",
          lastmod: "2024-03-15",
          changefreq: "weekly",
          priority: 0.7,
        },
      ];
      const xml = generateSitemapXml(entries);

      expect(xml).toContain("<lastmod>2024-03-15</lastmod>");
      expect(xml).toContain("<changefreq>weekly</changefreq>");
      expect(xml).toContain("<priority>0.7</priority>");
    });

    it("omits optional fields when not provided", () => {
      const entries: SitemapEntry[] = [{ loc: "/about" }];
      const xml = generateSitemapXml(entries);

      expect(xml).not.toContain("<lastmod>");
      expect(xml).not.toContain("<changefreq>");
      expect(xml).not.toContain("<priority>");
    });

    it("escapes special XML characters in URLs", () => {
      const entries: SitemapEntry[] = [{ loc: "/search?q=test&page=1" }];
      const xml = generateSitemapXml(entries);

      expect(xml).toContain("q=test&amp;page=1");
      expect(xml).not.toContain("q=test&page=1");
    });

    it("handles empty entries array", () => {
      const xml = generateSitemapXml([]);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<urlset");
      expect(xml).toContain("</urlset>");
      expect(xml).not.toContain("<url>");
    });

    it("formats priority with one decimal place", () => {
      const entries: SitemapEntry[] = [
        { loc: "/", priority: 1 },
        { loc: "/about", priority: 0.5 },
      ];
      const xml = generateSitemapXml(entries);

      expect(xml).toContain("<priority>1.0</priority>");
      expect(xml).toContain("<priority>0.5</priority>");
    });
  });
});
