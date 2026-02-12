import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

describe("Phase 0.1: Project Scaffolding", () => {
  describe("Config files exist and are valid", () => {
    it("should have astro.config.mjs", () => {
      const configPath = resolve(rootDir, "astro.config.mjs");
      expect(existsSync(configPath)).toBe(true);
    });

    it("should have tsconfig.json with strict mode", () => {
      const tsconfigPath = resolve(rootDir, "tsconfig.json");
      expect(existsSync(tsconfigPath)).toBe(true);
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
      expect(tsconfig.extends).toContain("strict");
    });

    it("should have vitest.config.ts", () => {
      const vitestPath = resolve(rootDir, "vitest.config.ts");
      expect(existsSync(vitestPath)).toBe(true);
    });

    it("should have playwright.config.ts", () => {
      const playwrightPath = resolve(rootDir, "playwright.config.ts");
      expect(existsSync(playwrightPath)).toBe(true);
    });

    it("should have eslint.config.js", () => {
      const eslintPath = resolve(rootDir, "eslint.config.js");
      expect(existsSync(eslintPath)).toBe(true);
    });

    it("should have .prettierrc", () => {
      const prettierPath = resolve(rootDir, ".prettierrc");
      expect(existsSync(prettierPath)).toBe(true);
    });

    it("should have .dev.vars.example", () => {
      const envPath = resolve(rootDir, ".dev.vars.example");
      expect(existsSync(envPath)).toBe(true);
    });
  });

  describe("Package.json has required scripts", () => {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf-8"));

    it("should have test script", () => {
      expect(pkg.scripts.test).toBeDefined();
    });

    it("should have lint script", () => {
      expect(pkg.scripts.lint).toBeDefined();
    });

    it("should have build script", () => {
      expect(pkg.scripts.build).toBeDefined();
    });

    it("should have typecheck script", () => {
      expect(pkg.scripts.typecheck).toBeDefined();
    });
  });

  describe("Dependencies are installed", () => {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    it("should have Preact", () => {
      expect(deps.preact).toBeDefined();
    });

    it("should have Tailwind CSS", () => {
      expect(deps.tailwindcss).toBeDefined();
    });

    it("should have Astro Preact integration", () => {
      expect(deps["@astrojs/preact"]).toBeDefined();
    });

    it("should have Cloudflare adapter", () => {
      expect(deps["@astrojs/cloudflare"]).toBeDefined();
    });

    it("should have Vitest", () => {
      expect(deps.vitest).toBeDefined();
    });

    it("should have Playwright", () => {
      expect(deps["@playwright/test"]).toBeDefined();
    });

    it("should have ESLint", () => {
      expect(deps.eslint).toBeDefined();
    });

    it("should have Prettier", () => {
      expect(deps.prettier).toBeDefined();
    });
  });

  describe("shadcn/ui setup", () => {
    it("should have utils.ts with cn function", () => {
      const utilsPath = resolve(rootDir, "src/lib/utils.ts");
      expect(existsSync(utilsPath)).toBe(true);
      const content = readFileSync(utilsPath, "utf-8");
      expect(content).toContain("export function cn");
    });

    it("should have required shadcn dependencies", () => {
      const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      expect(deps.clsx).toBeDefined();
      expect(deps["tailwind-merge"]).toBeDefined();
      expect(deps["class-variance-authority"]).toBeDefined();
    });
  });
});
