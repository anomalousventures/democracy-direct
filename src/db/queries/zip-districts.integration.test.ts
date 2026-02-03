import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { zipDistricts } from "@/db/schema";
import { getDistrictsByZip } from "./zip-districts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("zip-districts queries (integration)", () => {
  let db: Database;
  const testZip = "00001";

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(zipDistricts)
      .values([
        { zip: testZip, state: "ZZ", district: "01", proportion: 0.7 },
        { zip: testZip, state: "ZZ", district: "02", proportion: 0.3 },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(zipDistricts).where(sql`zip = ${testZip}`);
  });

  describe("getDistrictsByZip", () => {
    it("returns districts ordered by proportion descending", async () => {
      const results = await getDistrictsByZip(db, testZip);

      expect(results.length).toBe(2);
      expect(results[0].district).toBe("01");
      expect(results[0].proportion).toBe(0.7);
      expect(results[1].district).toBe("02");
      expect(results[1].proportion).toBe(0.3);
    });

    it("returns empty array for non-existent zip", async () => {
      const results = await getDistrictsByZip(db, "99999");
      expect(results).toEqual([]);
    });

    it("returns correct state for each result", async () => {
      const results = await getDistrictsByZip(db, testZip);
      expect(results.every((r) => r.state === "ZZ")).toBe(true);
    });
  });
});
