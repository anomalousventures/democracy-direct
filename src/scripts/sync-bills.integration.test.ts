import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Database } from "@/db/client";
import { bills, legislators, syncCursors } from "@/db/schema";
import { transformBillItem, type TransformResult } from "./sync-bills";
import type { BillListItem } from "@/lib/types/legislation";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for integration tests");
}

describe("sync-bills (integration)", () => {
  let db: Database;
  const testBioguideId = "S000001";
  const testCongress = 999;

  beforeAll(async () => {
    db = createDb(DATABASE_URL!);

    await db
      .insert(legislators)
      .values({
        bioguideId: testBioguideId,
        firstName: "Sync",
        lastName: "Tester",
        fullName: "Sync Tester",
        party: "I",
        state: "DC",
        chamber: "house",
        title: "Representative",
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(bills).where(eq(bills.congress, testCongress));
    await db.delete(legislators).where(eq(legislators.bioguideId, testBioguideId));
    await db.delete(syncCursors).where(eq(syncCursors.id, "test_sync"));
  });

  describe("sync loop warning case handling", () => {
    it("upserts bills with missing introducedDate when latestActionDate exists", async () => {
      const billItem: BillListItem = {
        congress: testCongress,
        type: "hr",
        number: 1,
        title: "Test Bill Without Introduced Date",
        url: "https://api.congress.gov/v3/bill/999/hr/1",
        latestAction: {
          actionDate: "2025-01-15",
          text: "Referred to Committee",
        },
        policyArea: { name: "Test Policy" },
        sponsors: [
          { bioguideId: testBioguideId, fullName: "Sync Tester", party: "I", state: "DC" },
        ],
      };

      const result = transformBillItem(billItem);

      expect(result.data).not.toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.error).toBe("Missing introducedDate, used latestActionDate as fallback");

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      if (result.data) {
        billsToUpsert.push(result.data);
      }
      if (result.error) {
        errors.push(result.error);
      }

      expect(billsToUpsert).toHaveLength(1);
      expect(errors).toHaveLength(1);

      await db
        .insert(bills)
        .values(
          billsToUpsert.map((b) => ({
            billNumber: b.billNumber,
            billType: b.billType,
            congress: b.congress,
            title: b.title,
            summary: b.summary,
            status: b.status,
            subjects: b.subjects,
            introducedDate: b.introducedDate,
            latestActionDate: b.latestActionDate,
            latestActionText: b.latestActionText,
            sponsorBioguideId: b.sponsorBioguideId,
            congressGovUrl: b.congressGovUrl,
          }))
        )
        .onConflictDoUpdate({
          target: [bills.congress, bills.billType, bills.billNumber],
          set: {
            title: billsToUpsert[0].title,
            updatedAt: new Date(),
          },
        });

      const [insertedBill] = await db
        .select()
        .from(bills)
        .where(
          and(
            eq(bills.congress, testCongress),
            eq(bills.billType, "hr"),
            eq(bills.billNumber, "HR.1")
          )
        );

      expect(insertedBill).toBeDefined();
      expect(insertedBill.title).toBe("Test Bill Without Introduced Date");
      expect(insertedBill.introducedDate).toEqual(new Date("2025-01-15"));
      expect(insertedBill.sponsorBioguideId).toBe(testBioguideId);
    });

    it("does not upsert bills when both introducedDate and latestActionDate are missing", async () => {
      const billItem: BillListItem = {
        congress: testCongress,
        type: "hr",
        number: 2,
        title: "Test Bill Without Any Dates",
        url: "https://api.congress.gov/v3/bill/999/hr/2",
      };

      const result = transformBillItem(billItem);

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.error).toBe("Missing both introducedDate and latestActionDate");

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      if (result.data) {
        billsToUpsert.push(result.data);
      }
      if (result.error) {
        errors.push(result.error);
      }

      expect(billsToUpsert).toHaveLength(0);
      expect(errors).toHaveLength(1);
    });

    it("correctly processes a batch with mixed valid, warning, and error cases", async () => {
      const testItems: BillListItem[] = [
        {
          congress: testCongress,
          type: "s",
          number: 10,
          title: "Valid Bill With Both Dates",
          url: "https://api.congress.gov/v3/bill/999/s/10",
          introducedDate: "2025-01-01",
          latestAction: { actionDate: "2025-01-20", text: "Passed Senate" },
        },
        {
          congress: testCongress,
          type: "s",
          number: 11,
          title: "Warning Bill Missing Introduced Date",
          url: "https://api.congress.gov/v3/bill/999/s/11",
          latestAction: { actionDate: "2025-01-15", text: "Referred to Committee" },
        },
        {
          congress: testCongress,
          type: "s",
          number: 12,
          title: "Error Bill Missing Both Dates",
          url: "https://api.congress.gov/v3/bill/999/s/12",
        },
      ];

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      for (const item of testItems) {
        const result = transformBillItem(item);
        if (result.data) {
          billsToUpsert.push(result.data);
        }
        if (result.error) {
          errors.push(result.error);
        }
      }

      expect(billsToUpsert).toHaveLength(2);
      expect(errors).toHaveLength(2);

      expect(billsToUpsert.map((b) => b.billNumber).sort()).toEqual(["S.10", "S.11"]);

      expect(errors.map((e) => e.billNumber).sort()).toEqual(["s11", "s12"]);

      await db.insert(bills).values(
        billsToUpsert.map((b) => ({
          billNumber: b.billNumber,
          billType: b.billType,
          congress: b.congress,
          title: b.title,
          summary: b.summary,
          status: b.status,
          subjects: b.subjects,
          introducedDate: b.introducedDate,
          latestActionDate: b.latestActionDate,
          latestActionText: b.latestActionText,
          sponsorBioguideId: b.sponsorBioguideId,
          congressGovUrl: b.congressGovUrl,
        }))
      );

      const insertedBills = await db.select().from(bills).where(eq(bills.congress, testCongress));

      const senatetBills = insertedBills.filter((b) => b.billType === "s");
      expect(senatetBills).toHaveLength(2);

      const billNumbers = senatetBills.map((b) => b.billNumber).sort();
      expect(billNumbers).toEqual(["S.10", "S.11"]);
    });
  });
});
