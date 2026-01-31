import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { users, emailOtps, sessions } from "../src/db/schema";

describe("Phase 0.4: Database Schema - User Tables", () => {
  describe("Users table schema", () => {
    const columns = getTableColumns(users);

    it("should have id as primary key (UUID)", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have email_hash field", () => {
      expect(columns.emailHash).toBeDefined();
    });

    it("should have trust_level field with default 0", () => {
      expect(columns.trustLevel).toBeDefined();
      expect(columns.trustLevel.default).toBe(0);
    });

    it("should have approved_templates_count field", () => {
      expect(columns.approvedTemplatesCount).toBeDefined();
    });

    it("should have saved_state and saved_district fields", () => {
      expect(columns.savedState).toBeDefined();
      expect(columns.savedDistrict).toBeDefined();
    });

    it("should have timestamps", () => {
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });
  });

  describe("Email OTPs table schema", () => {
    const columns = getTableColumns(emailOtps);

    it("should have id as primary key (UUID)", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have email_hash field", () => {
      expect(columns.emailHash).toBeDefined();
    });

    it("should have otp_hash field", () => {
      expect(columns.otpHash).toBeDefined();
    });

    it("should have expires_at field", () => {
      expect(columns.expiresAt).toBeDefined();
    });

    it("should have used_at field (nullable)", () => {
      expect(columns.usedAt).toBeDefined();
    });

    it("should have created_at timestamp", () => {
      expect(columns.createdAt).toBeDefined();
    });
  });

  describe("Sessions table schema", () => {
    const columns = getTableColumns(sessions);

    it("should have id as primary key (UUID)", () => {
      expect(columns.id).toBeDefined();
      expect(columns.id.primary).toBe(true);
    });

    it("should have user_id foreign key", () => {
      expect(columns.userId).toBeDefined();
    });

    it("should have expires_at field", () => {
      expect(columns.expiresAt).toBeDefined();
    });

    it("should have created_at timestamp", () => {
      expect(columns.createdAt).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("should export User type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.users).toBeDefined();
    });

    it("should export EmailOtp type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.emailOtps).toBeDefined();
    });

    it("should export Session type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.sessions).toBeDefined();
    });
  });
});
