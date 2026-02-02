import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { legislators } from "@/db/schema";
import { getLegislatorByBioguideId, getLegislatorsByStateAndDistrict } from "./legislators";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("legislators queries (integration)", () => {
  let db: Database;
  const testBioguideIds = ["INTTEST01", "INTTEST02", "INTTEST03"];

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(legislators)
      .values([
        {
          bioguideId: "INTTEST01",
          firstName: "Test",
          lastName: "Senator",
          fullName: "Test Senator",
          party: "D",
          state: "ZZ",
          chamber: "senate",
          title: "Senator",
        },
        {
          bioguideId: "INTTEST02",
          firstName: "Test",
          lastName: "Representative",
          fullName: "Test Representative",
          party: "R",
          state: "ZZ",
          district: "01",
          chamber: "house",
          title: "Representative",
        },
        {
          bioguideId: "INTTEST03",
          firstName: "Other",
          lastName: "Senator",
          fullName: "Other Senator",
          party: "I",
          state: "ZZ",
          chamber: "senate",
          title: "Senator",
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    for (const bioguideId of testBioguideIds) {
      await db.delete(legislators).where(sql`bioguide_id = ${bioguideId}`);
    }
  });

  describe("getLegislatorByBioguideId", () => {
    it("returns legislator when found", async () => {
      const legislator = await getLegislatorByBioguideId(db, "INTTEST01");
      expect(legislator).not.toBeNull();
      expect(legislator?.fullName).toBe("Test Senator");
      expect(legislator?.chamber).toBe("senate");
    });

    it("returns null for non-existent bioguide ID", async () => {
      const legislator = await getLegislatorByBioguideId(db, "NONEXISTENT");
      expect(legislator).toBeNull();
    });
  });

  describe("getLegislatorsByStateAndDistrict", () => {
    it("returns senators and matching district representative", async () => {
      const results = await getLegislatorsByStateAndDistrict(db, "ZZ", "01");

      expect(results.length).toBe(3);

      const senators = results.filter((l) => l.chamber === "senate");
      const reps = results.filter((l) => l.chamber === "house");

      expect(senators.length).toBe(2);
      expect(reps.length).toBe(1);
      expect(reps[0].district).toBe("01");
    });

    it("returns only senators for non-existent district", async () => {
      const results = await getLegislatorsByStateAndDistrict(db, "ZZ", "99");

      expect(results.length).toBe(2);
      expect(results.every((l) => l.chamber === "senate")).toBe(true);
    });

    it("returns empty array for non-existent state", async () => {
      const results = await getLegislatorsByStateAndDistrict(db, "XX", "01");
      expect(results).toEqual([]);
    });
  });
});
