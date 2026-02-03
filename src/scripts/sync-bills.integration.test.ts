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

  describe("sync loop with detail fetch simulation", () => {
    it("upserts bills with introducedDate from detail fetch", async () => {
      const billItem: BillListItem = {
        congress: testCongress,
        type: "hr",
        number: 1,
        title: "Test Bill With Detail Fetch",
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

      const detailIntroducedDate = "2025-01-01";
      const result = transformBillItem(billItem, detailIntroducedDate);

      expect(result.data).not.toBeNull();
      expect(result.data?.introducedDate).toEqual(new Date("2025-01-01"));
      expect(result.warning).toBeNull();
      expect(result.error).toBeNull();

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const warnings: NonNullable<TransformResult["warning"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      if (result.data) {
        billsToUpsert.push(result.data);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
      if (result.error) {
        errors.push(result.error);
      }

      expect(billsToUpsert).toHaveLength(1);
      expect(warnings).toHaveLength(0);
      expect(errors).toHaveLength(0);

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
      expect(insertedBill.title).toBe("Test Bill With Detail Fetch");
      expect(insertedBill.introducedDate).toEqual(new Date("2025-01-01"));
      expect(insertedBill.sponsorBioguideId).toBe(testBioguideId);
    });

    it("falls back to latestActionDate when detail fetch fails (warning)", async () => {
      const billItem: BillListItem = {
        congress: testCongress,
        type: "hr",
        number: 2,
        title: "Test Bill With Failed Detail Fetch",
        url: "https://api.congress.gov/v3/bill/999/hr/2",
        latestAction: {
          actionDate: "2025-01-15",
          text: "Referred to Committee",
        },
      };

      const result = transformBillItem(billItem);

      expect(result.data).not.toBeNull();
      expect(result.data?.introducedDate).toEqual(new Date("2025-01-15"));
      expect(result.warning).not.toBeNull();
      expect(result.warning?.message).toBe(
        "Detail fetch failed, used latestActionDate as fallback"
      );
      expect(result.error).toBeNull();
    });

    it("does not upsert bills when detail fetch fails and latestActionDate is missing (error)", async () => {
      const billItem: BillListItem = {
        congress: testCongress,
        type: "hr",
        number: 3,
        title: "Test Bill Without Any Dates",
        url: "https://api.congress.gov/v3/bill/999/hr/3",
      };

      const result = transformBillItem(billItem);

      expect(result.data).toBeNull();
      expect(result.warning).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe("Missing both introducedDate and latestActionDate");

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const warnings: NonNullable<TransformResult["warning"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      if (result.data) {
        billsToUpsert.push(result.data);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
      if (result.error) {
        errors.push(result.error);
      }

      expect(billsToUpsert).toHaveLength(0);
      expect(warnings).toHaveLength(0);
      expect(errors).toHaveLength(1);
    });

    it("correctly processes a batch simulating mixed detail fetch results", async () => {
      const testItems: Array<{ item: BillListItem; detailIntroducedDate?: string }> = [
        {
          item: {
            congress: testCongress,
            type: "s",
            number: 10,
            title: "Valid Bill With Detail",
            url: "https://api.congress.gov/v3/bill/999/s/10",
            latestAction: { actionDate: "2025-01-20", text: "Passed Senate" },
          },
          detailIntroducedDate: "2025-01-01",
        },
        {
          item: {
            congress: testCongress,
            type: "s",
            number: 11,
            title: "Bill With Failed Detail Fetch",
            url: "https://api.congress.gov/v3/bill/999/s/11",
            latestAction: { actionDate: "2025-01-15", text: "Referred to Committee" },
          },
        },
        {
          item: {
            congress: testCongress,
            type: "s",
            number: 12,
            title: "Error Bill Missing Both Dates",
            url: "https://api.congress.gov/v3/bill/999/s/12",
          },
        },
      ];

      const billsToUpsert: NonNullable<TransformResult["data"]>[] = [];
      const warnings: NonNullable<TransformResult["warning"]>[] = [];
      const errors: NonNullable<TransformResult["error"]>[] = [];

      for (const { item, detailIntroducedDate } of testItems) {
        const result = transformBillItem(item, detailIntroducedDate);
        if (result.data) {
          billsToUpsert.push(result.data);
        }
        if (result.warning) {
          warnings.push(result.warning);
        }
        if (result.error) {
          errors.push(result.error);
        }
      }

      expect(billsToUpsert).toHaveLength(2);
      expect(warnings).toHaveLength(1);
      expect(errors).toHaveLength(1);

      expect(billsToUpsert.map((b) => b.billNumber).sort()).toEqual(["S.10", "S.11"]);
      expect(warnings.map((w) => w.billNumber)).toEqual(["s11"]);
      expect(errors.map((e) => e.billNumber)).toEqual(["s12"]);

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

      const senateBills = insertedBills.filter((b) => b.billType === "s");
      expect(senateBills).toHaveLength(2);

      const billNumbers = senateBills.map((b) => b.billNumber).sort();
      expect(billNumbers).toEqual(["S.10", "S.11"]);
    });
  });
});
