import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDb, checkDbConnection } from "./db";

describe("db utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getDb", () => {
    it("throws when DATABASE_URL is not set", () => {
      delete process.env.DATABASE_URL;
      expect(() => getDb()).toThrow("DATABASE_URL environment variable is required");
    });

    it("returns a database instance when DATABASE_URL is set", () => {
      process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test?sslmode=require";
      const db = getDb();
      expect(db).toBeDefined();
    });
  });

  describe("checkDbConnection", () => {
    it("returns false when DATABASE_URL is not set", async () => {
      delete process.env.DATABASE_URL;
      const result = await checkDbConnection();
      expect(result).toBe(false);
    });

    it("returns false when database connection fails", async () => {
      process.env.DATABASE_URL =
        "postgresql://invalid:invalid@nonexistent.host:5432/test?sslmode=require";
      const result = await checkDbConnection();
      expect(result).toBe(false);
    });
  });
});
