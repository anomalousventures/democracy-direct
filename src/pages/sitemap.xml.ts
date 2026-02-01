import type { APIRoute } from "astro";
import { createDb } from "@/db/client";
import { legislators, templates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { generateSitemapXml, formatDate, type SitemapEntry } from "@/lib/sitemap";

export const prerender = false;

const STATIC_PAGES: SitemapEntry[] = [
  { loc: "/", priority: 1.0, changefreq: "daily" },
  { loc: "/about", priority: 0.8, changefreq: "monthly" },
  { loc: "/privacy", priority: 0.5, changefreq: "yearly" },
  { loc: "/roadmap", priority: 0.7, changefreq: "weekly" },
  { loc: "/templates", priority: 0.9, changefreq: "daily" },
];

export const GET: APIRoute = async ({ locals }) => {
  try {
    const config = getConfig(locals);
    const db = createDb(config.database.url);

    const allLegislators = await db
      .select({ bioguideId: legislators.bioguideId })
      .from(legislators);

    const publicTemplates = await db
      .select({ slug: templates.slug, updatedAt: templates.updatedAt })
      .from(templates)
      .where(and(eq(templates.isPublic, true), eq(templates.moderationStatus, "approved")));

    const entries: SitemapEntry[] = [
      ...STATIC_PAGES,
      ...allLegislators.map((l) => ({
        loc: `/rep/${l.bioguideId}`,
        changefreq: "monthly" as const,
        priority: 0.8,
      })),
      ...publicTemplates.map((t) => ({
        loc: `/templates/${t.slug}`,
        lastmod: formatDate(t.updatedAt),
        changefreq: "weekly" as const,
        priority: 0.7,
      })),
    ];

    const xml = generateSitemapXml(entries);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
};
