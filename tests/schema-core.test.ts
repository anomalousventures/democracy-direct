import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { getTableColumns } from "drizzle-orm";
import { legislators, zipDistricts } from "../src/db/schema";

const rootDir = resolve(__dirname, "..");

describe("Phase 0.3: Database Schema - Core Tables", () => {
  describe("Schema file exists", () => {
    it("should have schema.ts in src/db", () => {
      const schemaPath = resolve(rootDir, "src/db/schema.ts");
      expect(existsSync(schemaPath)).toBe(true);
    });
  });

  describe("Legislators table schema", () => {
    const columns = getTableColumns(legislators);

    it("should have bioguide_id as primary key", () => {
      expect(columns.bioguideId).toBeDefined();
      expect(columns.bioguideId.primary).toBe(true);
    });

    it("should have required name fields", () => {
      expect(columns.firstName).toBeDefined();
      expect(columns.lastName).toBeDefined();
      expect(columns.fullName).toBeDefined();
    });

    it("should have party field", () => {
      expect(columns.party).toBeDefined();
    });

    it("should have state and district fields", () => {
      expect(columns.state).toBeDefined();
      expect(columns.district).toBeDefined();
    });

    it("should have chamber field", () => {
      expect(columns.chamber).toBeDefined();
    });

    it("should have contact fields", () => {
      expect(columns.phoneCapitol).toBeDefined();
      expect(columns.contactFormUrl).toBeDefined();
    });

    it("should have social media fields", () => {
      expect(columns.twitterHandle).toBeDefined();
      expect(columns.facebookId).toBeDefined();
    });
  });

  describe("Zip Districts table schema", () => {
    const columns = getTableColumns(zipDistricts);

    it("should have zip field", () => {
      expect(columns.zip).toBeDefined();
    });

    it("should have state field", () => {
      expect(columns.state).toBeDefined();
    });

    it("should have district field", () => {
      expect(columns.district).toBeDefined();
    });

    it("should have proportion field", () => {
      expect(columns.proportion).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("should export Legislator type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.legislators).toBeDefined();
    });

    it("should export ZipDistrict type", async () => {
      const schema = await import("../src/db/schema");
      expect(schema.zipDistricts).toBeDefined();
    });
  });

  describe("Drizzle configuration", () => {
    it("should have drizzle.config.ts", () => {
      const configPath = resolve(rootDir, "drizzle.config.ts");
      expect(existsSync(configPath)).toBe(true);
    });

    it("should have db:generate script in package.json", () => {
      const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf-8"));
      expect(pkg.scripts["db:generate"]).toBeDefined();
    });
  });
});
