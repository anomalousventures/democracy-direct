import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { campaignFinance, legislators } from "@/db/schema";
import { getFinanceByMember } from "./campaign-finance";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("campaign-finance queries (integration)", () => {
  let db: Database;
  const testBioguideId = "T000099";

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(legislators)
      .values({
        bioguideId: testBioguideId,
        firstName: "Test",
        lastName: "Finance",
        fullName: "Test Finance",
        party: "D",
        state: "VT",
        chamber: "senate",
        title: "Senator",
      })
      .onConflictDoNothing();

    await db
      .insert(campaignFinance)
      .values([
        {
          bioguideId: testBioguideId,
          fecId: "S4VT99999",
          cycle: "2022",
          totalReceipts: 50000,
          totalDisbursements: 40000,
          cashOnHand: 10000,
          totalFromPACs: 15000,
          totalFromIndividuals: 30000,
          debtsOwed: null,
          sourceUrl: null,
          lastUpdated: new Date("2022-12-01"),
        },
        {
          bioguideId: testBioguideId,
          fecId: "S4VT99999",
          cycle: "2024",
          totalReceipts: 100000,
          totalDisbursements: 90000,
          cashOnHand: 10000,
          totalFromPACs: 30000,
          totalFromIndividuals: 60000,
          debtsOwed: 5000,
          sourceUrl: "https://www.fec.gov/test",
          lastUpdated: new Date("2024-12-01"),
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(campaignFinance).where(eq(campaignFinance.bioguideId, testBioguideId));
    await db.delete(legislators).where(eq(legislators.bioguideId, testBioguideId));
  });

  describe("getFinanceByMember", () => {
    it("returns the most recent cycle record", async () => {
      const result = await getFinanceByMember(db, testBioguideId);

      expect(result).not.toBeNull();
      expect(result!.cycle).toBe("2024");
      expect(result!.totalReceipts).toBe(100000);
      expect(result!.debtsOwed).toBe(5000);
    });

    it("returns data with expected shape", async () => {
      const result = await getFinanceByMember(db, testBioguideId);

      expect(result).toMatchObject({
        bioguideId: testBioguideId,
        fecId: "S4VT99999",
        cycle: "2024",
        totalReceipts: expect.any(Number),
        totalDisbursements: expect.any(Number),
        cashOnHand: expect.any(Number),
        totalFromPACs: expect.any(Number),
        totalFromIndividuals: expect.any(Number),
        lastUpdated: expect.any(Date),
        createdAt: expect.any(Date),
      });
    });

    it("returns null for a legislator without finance records", async () => {
      const result = await getFinanceByMember(db, "NONEXIST");

      expect(result).toBeNull();
    });
  });
});
