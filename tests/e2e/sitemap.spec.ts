import { test, expect } from "@playwright/test";

test.describe("Sitemap", () => {
  test("returns valid XML with correct content type", async ({ request }) => {
    const response = await request.get("/sitemap.xml");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/xml");
  });

  test("contains required XML structure", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const xml = await response.text();

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  test("includes static pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const xml = await response.text();

    expect(xml).toContain("<loc>https://democracy-direct.com/</loc>");
    expect(xml).toContain("<loc>https://democracy-direct.com/about</loc>");
    expect(xml).toContain("<loc>https://democracy-direct.com/privacy</loc>");
    expect(xml).toContain("<loc>https://democracy-direct.com/roadmap</loc>");
    expect(xml).toContain("<loc>https://democracy-direct.com/templates</loc>");
  });

  test("includes legislator pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const xml = await response.text();

    expect(xml).toContain("/rep/");
    expect(xml).toMatch(/<loc>https:\/\/democracy-direct\.com\/rep\/[A-Z]\d{6}<\/loc>/);
  });

  test("includes template pages when public templates exist", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const xml = await response.text();

    expect(xml).toMatch(/<loc>https:\/\/democracy-direct\.com\/templates\/[^<]+<\/loc>/);
  });

  test("has cache control header", async ({ request }) => {
    const response = await request.get("/sitemap.xml");

    expect(response.headers()["cache-control"]).toContain("max-age=86400");
  });
});
