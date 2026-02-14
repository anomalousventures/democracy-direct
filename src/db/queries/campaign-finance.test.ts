import { describe, it, expect, vi } from "vitest";
import { getFinanceByMember } from "./campaign-finance";
import type { Database } from "../client";

function createMockDb(returnValue: unknown = null) {
  const findFirst = vi.fn().mockResolvedValue(returnValue);
  return {
    db: {
      query: {
        campaignFinance: { findFirst },
      },
    } as unknown as Database,
    findFirst,
  };
}

describe("getFinanceByMember", () => {
  it("returns finance data for a legislator with records", async () => {
    const record = {
      id: "test-id",
      bioguideId: "S000033",
      fecId: "S4VT00033",
      cycle: "2024",
      totalReceipts: 100000,
      totalDisbursements: 90000,
      cashOnHand: 10000,
      totalFromPACs: 30000,
      totalFromIndividuals: 60000,
      debtsOwed: null,
      sourceUrl: null,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    const { db } = createMockDb(record);

    const result = await getFinanceByMember(db, "S000033");

    expect(result).toEqual(record);
  });

  it("returns null for a legislator without records", async () => {
    const { db } = createMockDb(undefined);

    const result = await getFinanceByMember(db, "NONEXIST");

    expect(result).toBeNull();
  });

  it("filters by bioguideId", async () => {
    const { db, findFirst } = createMockDb(null);

    await getFinanceByMember(db, "P000197");

    const callArgs = findFirst.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
  });

  it("orders by cycle descending", async () => {
    const { db, findFirst } = createMockDb(null);

    await getFinanceByMember(db, "P000197");

    const callArgs = findFirst.mock.calls[0][0];
    expect(callArgs).toHaveProperty("orderBy");
  });
});

describe("campaign-finance query module exports", () => {
  it("exports getFinanceByMember function", async () => {
    const mod = await import("./campaign-finance");
    expect(typeof mod.getFinanceByMember).toBe("function");
  });

  it("exports CampaignFinanceData type alias", async () => {
    const mod = await import("./campaign-finance");
    expect(mod).toHaveProperty("getFinanceByMember");
  });
});
