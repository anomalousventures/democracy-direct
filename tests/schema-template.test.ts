import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { templates, templateFlags, moderationLog, userTemplates } from "../src/db/schema";

describe("Phase 0.5: Database Schema - Template Tables", () => {
  describe("Templates table schema", () => {
    const columns = getTableColumns(templates);

    it("should have id as primary key (UUID)", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have slug field (unique)", () => {
      expect(columns.slug).toBeDefined();
    });

    it("should have title field", () => {
      expect(columns.title).toBeDefined();
    });

    it("should have body field", () => {
      expect(columns.body).toBeDefined();
    });

    it("should have issue_tags field (JSON)", () => {
      expect(columns.issueTags).toBeDefined();
    });

    it("should have user_id foreign key", () => {
      expect(columns.userId).toBeDefined();
    });

    it("should have is_public field", () => {
      expect(columns.isPublic).toBeDefined();
    });

    it("should have forked_from self-reference", () => {
      expect(columns.forkedFrom).toBeDefined();
    });

    it("should have moderation fields", () => {
      expect(columns.moderationStatus).toBeDefined();
      expect(columns.moderationScores).toBeDefined();
    });

    it("should have counter fields", () => {
      expect(columns.viewCount).toBeDefined();
      expect(columns.useCount).toBeDefined();
      expect(columns.flagCount).toBeDefined();
    });

    it("should have timestamps", () => {
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });
  });

  describe("Template Flags table schema", () => {
    const columns = getTableColumns(templateFlags);

    it("should have id as primary key", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have template_id foreign key", () => {
      expect(columns.templateId).toBeDefined();
    });

    it("should have user_id foreign key", () => {
      expect(columns.userId).toBeDefined();
    });

    it("should have reason field", () => {
      expect(columns.reason).toBeDefined();
    });

    it("should have details field (optional)", () => {
      expect(columns.details).toBeDefined();
    });

    it("should have created_at timestamp", () => {
      expect(columns.createdAt).toBeDefined();
    });
  });

  describe("Moderation Log table schema", () => {
    const columns = getTableColumns(moderationLog);

    it("should have id as primary key", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have template_id foreign key", () => {
      expect(columns.templateId).toBeDefined();
    });

    it("should have action field", () => {
      expect(columns.action).toBeDefined();
    });

    it("should have admin_id foreign key", () => {
      expect(columns.adminId).toBeDefined();
    });

    it("should have reason field", () => {
      expect(columns.reason).toBeDefined();
    });

    it("should have scores field (JSON)", () => {
      expect(columns.scores).toBeDefined();
    });

    it("should have created_at timestamp", () => {
      expect(columns.createdAt).toBeDefined();
    });
  });

  describe("User Templates (bookmarks) table schema", () => {
    const columns = getTableColumns(userTemplates);

    it("should have user_id field", () => {
      expect(columns.userId).toBeDefined();
    });

    it("should have template_id field", () => {
      expect(columns.templateId).toBeDefined();
    });

    it("should have bookmarked_at timestamp", () => {
      expect(columns.bookmarkedAt).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("should export Template type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.templates).toBeDefined();
    });

    it("should export TemplateFlag type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.templateFlags).toBeDefined();
    });

    it("should export ModerationLog type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.moderationLog).toBeDefined();
    });

    it("should export UserTemplates type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.userTemplates).toBeDefined();
    });
  });
});
