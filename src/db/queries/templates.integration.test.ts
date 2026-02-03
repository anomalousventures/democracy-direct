import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { templates, issueTags, templateIssueTags, users } from "@/db/schema";
import {
  searchTemplatesWithCursor,
  getApprovedTagNames,
  linkTemplateTags,
  unlinkAllTemplateTags,
  syncTemplateTags,
  decodeCursor,
} from "./templates";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("templates queries (integration)", () => {
  let db: Database;
  const testTemplateIds: string[] = [];
  const testTagIds: string[] = [];
  const testUserId = "00000000-0000-0000-0000-000000000001";

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(users)
      .values({
        id: testUserId,
        emailHash: "test-email-hash-templates-integration",
        trustLevel: 0,
      })
      .onConflictDoNothing();

    const tagNames = ["integration-test-tag-1", "integration-test-tag-2", "integration-test-tag-3"];
    for (const name of tagNames) {
      const [tag] = await db
        .insert(issueTags)
        .values({
          name,
          status: "approved",
          suggestedBy: testUserId,
          approvedBy: testUserId,
        })
        .onConflictDoUpdate({
          target: issueTags.name,
          set: { status: "approved" },
        })
        .returning({ id: issueTags.id });
      testTagIds.push(tag.id);
    }

    const templateData = [
      {
        slug: "integration-test-template-1",
        title: "Integration Test Template 1",
        description: "First test template for integration testing",
        body: "This is the body of the first test template.",
        issueTags: ["integration-test-tag-1"],
        viewCount: 100,
        useCount: 50,
      },
      {
        slug: "integration-test-template-2",
        title: "Integration Test Template 2",
        description: "Second test template with healthcare focus",
        body: "Healthcare related content here.",
        issueTags: ["integration-test-tag-1", "integration-test-tag-2"],
        viewCount: 50,
        useCount: 25,
      },
      {
        slug: "integration-test-template-3",
        title: "Integration Test Template 3",
        description: "Third test template about environment",
        body: "Environmental protection content.",
        issueTags: ["integration-test-tag-3"],
        viewCount: 25,
        useCount: 10,
      },
    ];

    for (const tpl of templateData) {
      const [template] = await db
        .insert(templates)
        .values({
          slug: tpl.slug,
          title: tpl.title,
          description: tpl.description,
          body: tpl.body,
          issueTags: tpl.issueTags,
          isPublic: true,
          moderationStatus: "approved",
          viewCount: tpl.viewCount,
          useCount: tpl.useCount,
          userId: testUserId,
        })
        .onConflictDoUpdate({
          target: templates.slug,
          set: {
            title: tpl.title,
            viewCount: tpl.viewCount,
            useCount: tpl.useCount,
            moderationStatus: "approved",
          },
        })
        .returning({ id: templates.id });

      testTemplateIds.push(template.id);

      const lowerTags = tpl.issueTags.map((t) => t.toLowerCase());
      const matchingTags = await db
        .select({ id: issueTags.id })
        .from(issueTags)
        .where(inArray(sql`LOWER(${issueTags.name})`, lowerTags));

      if (matchingTags.length > 0) {
        await db.delete(templateIssueTags).where(eq(templateIssueTags.templateId, template.id));
        await db.insert(templateIssueTags).values(
          matchingTags.map((tag) => ({
            templateId: template.id,
            issueTagId: tag.id,
          }))
        );
      }
    }
  });

  afterAll(async () => {
    for (const id of testTemplateIds) {
      await db.delete(templateIssueTags).where(eq(templateIssueTags.templateId, id));
      await db.delete(templates).where(eq(templates.id, id));
    }

    for (const id of testTagIds) {
      await db.delete(issueTags).where(eq(issueTags.id, id));
    }

    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("searchTemplatesWithCursor", () => {
    it("returns templates sorted by popularity (viewCount + useCount)", async () => {
      const result = await searchTemplatesWithCursor(db, { limit: 10 });

      expect(result.items.length).toBeGreaterThan(0);

      const testTemplates = result.items.filter((t) =>
        t.slug.startsWith("integration-test-template")
      );
      expect(testTemplates.length).toBe(3);

      for (let i = 0; i < testTemplates.length - 1; i++) {
        const currentScore = testTemplates[i].viewCount + testTemplates[i].useCount;
        const nextScore = testTemplates[i + 1].viewCount + testTemplates[i + 1].useCount;
        expect(currentScore).toBeGreaterThanOrEqual(nextScore);
      }
    });

    it("supports text search on title", async () => {
      const result = await searchTemplatesWithCursor(db, {
        search: "Integration Test Template 1",
      });

      const testTemplate = result.items.find((t) => t.slug === "integration-test-template-1");
      expect(testTemplate).toBeDefined();
    });

    it("supports text search on description", async () => {
      const result = await searchTemplatesWithCursor(db, {
        search: "healthcare",
      });

      const testTemplate = result.items.find((t) => t.slug === "integration-test-template-2");
      expect(testTemplate).toBeDefined();
    });

    it("filters by tags", async () => {
      const result = await searchTemplatesWithCursor(db, {
        tags: ["integration-test-tag-3"],
      });

      const testTemplates = result.items.filter((t) =>
        t.slug.startsWith("integration-test-template")
      );
      expect(testTemplates.length).toBe(1);
      expect(testTemplates[0].slug).toBe("integration-test-template-3");
    });

    it("supports OR logic for multiple tags", async () => {
      const result = await searchTemplatesWithCursor(db, {
        tags: ["integration-test-tag-1", "integration-test-tag-3"],
      });

      const testTemplates = result.items.filter((t) =>
        t.slug.startsWith("integration-test-template")
      );
      expect(testTemplates.length).toBe(3);
    });

    it("returns empty results for non-existent tags", async () => {
      const result = await searchTemplatesWithCursor(db, {
        tags: ["nonexistent-tag-xyz"],
      });

      expect(result.items.length).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("respects limit parameter", async () => {
      const result = await searchTemplatesWithCursor(db, { limit: 2 });

      expect(result.items.length).toBeLessThanOrEqual(2);
    });

    it("returns hasMore and nextCursor when more results exist", async () => {
      const result = await searchTemplatesWithCursor(db, { limit: 1 });

      if (result.hasMore) {
        expect(result.nextCursor).not.toBeNull();
      }
    });

    it("supports cursor-based pagination", async () => {
      const firstPage = await searchTemplatesWithCursor(db, { limit: 2 });

      if (firstPage.hasMore && firstPage.nextCursor) {
        const secondPage = await searchTemplatesWithCursor(db, {
          limit: 2,
          cursor: firstPage.nextCursor,
        });

        const firstPageIds = firstPage.items.map((t) => t.id);
        const secondPageIds = secondPage.items.map((t) => t.id);
        const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it("cursor contains correct data structure", async () => {
      const result = await searchTemplatesWithCursor(db, { limit: 1 });

      if (result.nextCursor) {
        const decoded = decodeCursor(result.nextCursor);
        expect(decoded).not.toBeNull();
        expect(typeof decoded?.score).toBe("number");
        expect(decoded?.createdAt).toBeInstanceOf(Date);
        expect(typeof decoded?.id).toBe("string");
      }
    });

    it("includes tags in results", async () => {
      const result = await searchTemplatesWithCursor(db);

      const testTemplate = result.items.find((t) => t.slug === "integration-test-template-2");
      expect(testTemplate).toBeDefined();
      expect(testTemplate?.tags.length).toBe(2);
      expect(testTemplate?.tags).toContain("integration-test-tag-1");
      expect(testTemplate?.tags).toContain("integration-test-tag-2");
    });

    it("only returns public approved templates", async () => {
      const result = await searchTemplatesWithCursor(db);

      for (const template of result.items) {
        const [dbTemplate] = await db
          .select({ isPublic: templates.isPublic, moderationStatus: templates.moderationStatus })
          .from(templates)
          .where(eq(templates.id, template.id));

        expect(dbTemplate.isPublic).toBe(true);
        expect(dbTemplate.moderationStatus).toBe("approved");
      }
    });

    it("combines search and tag filter", async () => {
      const result = await searchTemplatesWithCursor(db, {
        search: "Integration",
        tags: ["integration-test-tag-1"],
      });

      const testTemplates = result.items.filter((t) =>
        t.slug.startsWith("integration-test-template")
      );
      expect(testTemplates.length).toBe(2);
    });
  });

  describe("getApprovedTagNames", () => {
    it("returns tag names that are used in approved templates", async () => {
      const tagNames = await getApprovedTagNames(db);

      expect(tagNames).toContain("integration-test-tag-1");
      expect(tagNames).toContain("integration-test-tag-2");
      expect(tagNames).toContain("integration-test-tag-3");
    });

    it("returns tags in alphabetical order", async () => {
      const tagNames = await getApprovedTagNames(db);

      const sorted = [...tagNames].sort((a, b) => a.localeCompare(b));
      expect(tagNames).toEqual(sorted);
    });
  });

  describe("linkTemplateTags", () => {
    it("creates junction table entries for tags", async () => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          slug: "link-test-template",
          title: "Link Test Template",
          body: "Test body content",
          isPublic: true,
          moderationStatus: "approved",
          userId: testUserId,
        })
        .returning({ id: templates.id });

      testTemplateIds.push(newTemplate.id);

      await linkTemplateTags(db, newTemplate.id, [
        "integration-test-tag-1",
        "integration-test-tag-2",
      ]);

      const links = await db
        .select()
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));

      expect(links.length).toBe(2);
    });

    it("handles empty tag array", async () => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          slug: "empty-tags-test-template",
          title: "Empty Tags Test Template",
          body: "Test body content",
          isPublic: true,
          moderationStatus: "approved",
          userId: testUserId,
        })
        .returning({ id: templates.id });

      testTemplateIds.push(newTemplate.id);

      await linkTemplateTags(db, newTemplate.id, []);

      const links = await db
        .select()
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));

      expect(links.length).toBe(0);
    });

    it("ignores non-existent tags", async () => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          slug: "nonexistent-tags-test-template",
          title: "Nonexistent Tags Test Template",
          body: "Test body content",
          isPublic: true,
          moderationStatus: "approved",
          userId: testUserId,
        })
        .returning({ id: templates.id });

      testTemplateIds.push(newTemplate.id);

      await linkTemplateTags(db, newTemplate.id, ["integration-test-tag-1", "nonexistent-tag-xyz"]);

      const links = await db
        .select()
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));

      expect(links.length).toBe(1);
    });
  });

  describe("unlinkAllTemplateTags", () => {
    it("removes all junction table entries for a template", async () => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          slug: "unlink-test-template",
          title: "Unlink Test Template",
          body: "Test body content",
          isPublic: true,
          moderationStatus: "approved",
          userId: testUserId,
        })
        .returning({ id: templates.id });

      testTemplateIds.push(newTemplate.id);

      await linkTemplateTags(db, newTemplate.id, [
        "integration-test-tag-1",
        "integration-test-tag-2",
      ]);

      let links = await db
        .select()
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));
      expect(links.length).toBe(2);

      await unlinkAllTemplateTags(db, newTemplate.id);

      links = await db
        .select()
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));
      expect(links.length).toBe(0);
    });
  });

  describe("syncTemplateTags", () => {
    it("replaces existing tags with new ones", async () => {
      const [newTemplate] = await db
        .insert(templates)
        .values({
          slug: "sync-test-template",
          title: "Sync Test Template",
          body: "Test body content",
          isPublic: true,
          moderationStatus: "approved",
          userId: testUserId,
        })
        .returning({ id: templates.id });

      testTemplateIds.push(newTemplate.id);

      await linkTemplateTags(db, newTemplate.id, [
        "integration-test-tag-1",
        "integration-test-tag-2",
      ]);

      await syncTemplateTags(db, newTemplate.id, ["integration-test-tag-3"]);

      const links = await db
        .select({ issueTagId: templateIssueTags.issueTagId })
        .from(templateIssueTags)
        .where(eq(templateIssueTags.templateId, newTemplate.id));

      expect(links.length).toBe(1);

      const [tagName] = await db
        .select({ name: issueTags.name })
        .from(issueTags)
        .where(eq(issueTags.id, links[0].issueTagId));

      expect(tagName.name).toBe("integration-test-tag-3");
    });
  });
});
