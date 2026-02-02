import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

describe("Phase 0.2: Database Connection", () => {
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
    it("should have DATABASE_URL in .dev.vars.example", () => {
      const envPath = resolve(rootDir, ".dev.vars.example");
      const content = readFileSync(envPath, "utf-8");
      expect(content).toContain("DATABASE_URL");
    });
  });
});
