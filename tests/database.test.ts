import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

describe("Phase 0.2: Database Connection", () => {
  describe("Database client module", () => {
    it("should have db.ts module", () => {
      const dbPath = resolve(rootDir, "src/lib/db.ts");
      expect(existsSync(dbPath)).toBe(true);
    });

    it("should export getDb function", async () => {
      const dbModule = await import("../src/lib/db");
      expect(typeof dbModule.getDb).toBe("function");
    });

    it("should export checkDbConnection function", async () => {
      const dbModule = await import("../src/lib/db");
      expect(typeof dbModule.checkDbConnection).toBe("function");
    });

    it("should throw error when DATABASE_URL is not set", async () => {
      const originalEnv = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      vi.resetModules();
      const { getDb } = await import("../src/lib/db");

      expect(() => getDb()).toThrow("DATABASE_URL environment variable is required");

      process.env.DATABASE_URL = originalEnv;
    });
  });

  describe("Health endpoint", () => {
    it("should have health endpoint file", () => {
      const healthPath = resolve(rootDir, "src/pages/api/health.ts");
      expect(existsSync(healthPath)).toBe(true);
    });

    it("should export GET handler", async () => {
      const healthModule = await import("../src/pages/api/health");
      expect(typeof healthModule.GET).toBe("function");
    });

    it("should have prerender set to false", async () => {
      const healthModule = await import("../src/pages/api/health");
      expect(healthModule.prerender).toBe(false);
    });
  });

  describe("Environment configuration", () => {
    it("should have DATABASE_URL in .env.example", () => {
      const envPath = resolve(rootDir, ".env.example");
      const content = readFileSync(envPath, "utf-8");
      expect(content).toContain("DATABASE_URL");
    });
  });
});
