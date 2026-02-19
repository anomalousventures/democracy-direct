import { describe, it, expect, vi } from "vitest";
import {
  getFinanceByMember,
  getTopPacDonors,
  getAllPacDonors,
  getIndependentExpenditures,
  getCommitteeById,
  getCommitteeContributions,
  getCommitteeExpenditures,
} from "./campaign-finance";
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

function createPacContributionsMockDb(returnValue: unknown = []) {
  const findMany = vi.fn().mockResolvedValue(returnValue);
  return {
    db: {
      query: {
        pacContributions: { findMany },
      },
    } as unknown as Database,
    findMany,
  };
}

function createIndependentExpendituresMockDb(returnValue: unknown = []) {
  const findMany = vi.fn().mockResolvedValue(returnValue);
  return {
    db: {
      query: {
        independentExpenditures: { findMany },
      },
    } as unknown as Database,
    findMany,
  };
}

function createCommitteesMockDb(returnValue: unknown = null) {
  const findFirst = vi.fn().mockResolvedValue(returnValue);
  return {
    db: {
      query: {
        committees: { findFirst },
      },
    } as unknown as Database,
    findFirst,
  };
}

const mockCommittee = {
  fecCommitteeId: "C00123456",
  name: "Test PAC",
  designation: "B",
  committeeType: "Q",
  party: null,
  treasurerName: "Jane Treasurer",
  state: "DC",
  sourceUrl: null,
  lastUpdated: new Date(),
  createdAt: new Date(),
};

const mockLegislator = {
  bioguideId: "S000033",
  firstName: "Bernie",
  lastName: "Sanders",
  fullName: "Bernie Sanders",
  party: "I",
  state: "VT",
  district: null,
  chamber: "senate",
  title: "Senator",
  termStart: "2019-01-03",
  termEnd: "2025-01-03",
  phoneCapitol: null,
  phoneDistrict: null,
  fax: null,
  addressCapitol: null,
  addressDistrict: null,
  contactFormUrl: null,
  website: null,
  twitterHandle: null,
  facebookId: null,
  youtubeId: null,
  lisId: null,
  fecIds: null,
};

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

describe("getTopPacDonors", () => {
  it("returns pac contributions with committee data", async () => {
    const records = [
      {
        id: "pac-1",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        recipientCommitteeId: null,
        cycle: "2024",
        totalAmount: 50000,
        contributionCount: 3,
        lastContributionDate: new Date(),
        committee: mockCommittee,
      },
    ];
    const { db } = createPacContributionsMockDb(records);

    const result = await getTopPacDonors(db, "S000033");

    expect(result).toEqual(records);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no contributions exist", async () => {
    const { db } = createPacContributionsMockDb([]);

    const result = await getTopPacDonors(db, "NONEXIST");

    expect(result).toEqual([]);
  });

  it("passes where, with, orderBy, and default limit", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getTopPacDonors(db, "S000033");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
    expect(callArgs).toHaveProperty("with");
    expect(callArgs.with).toEqual({ committee: true });
    expect(callArgs).toHaveProperty("orderBy");
    expect(callArgs.limit).toBe(5);
  });

  it("applies cycle filter when provided", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getTopPacDonors(db, "S000033", { cycle: "2024" });

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
  });

  it("applies custom limit when provided", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getTopPacDonors(db, "S000033", { limit: 10 });

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs.limit).toBe(10);
  });
});

describe("getAllPacDonors", () => {
  it("returns all pac contributions for a cycle", async () => {
    const records = [
      {
        id: "pac-1",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        recipientCommitteeId: null,
        cycle: "2024",
        totalAmount: 50000,
        contributionCount: 3,
        lastContributionDate: new Date(),
        committee: mockCommittee,
      },
      {
        id: "pac-2",
        bioguideId: "S000033",
        committeeId: "C00654321",
        fecId: "S4VT00033",
        recipientCommitteeId: null,
        cycle: "2024",
        totalAmount: 25000,
        contributionCount: 1,
        lastContributionDate: new Date(),
        committee: { ...mockCommittee, fecCommitteeId: "C00654321", name: "Other PAC" },
      },
    ];
    const { db } = createPacContributionsMockDb(records);

    const result = await getAllPacDonors(db, "S000033", "2024");

    expect(result).toEqual(records);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no contributions exist for cycle", async () => {
    const { db } = createPacContributionsMockDb([]);

    const result = await getAllPacDonors(db, "S000033", "2020");

    expect(result).toEqual([]);
  });

  it("passes where, with, orderBy, and default limit", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getAllPacDonors(db, "S000033", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
    expect(callArgs).toHaveProperty("with");
    expect(callArgs.with).toEqual({ committee: true });
    expect(callArgs).toHaveProperty("orderBy");
    expect(callArgs.limit).toBe(50);
  });

  it("applies custom limit and offset when provided", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getAllPacDonors(db, "S000033", "2024", { limit: 20, offset: 40 });

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs.limit).toBe(20);
    expect(callArgs.offset).toBe(40);
  });

  it("leaves offset undefined when not provided", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getAllPacDonors(db, "S000033", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs.offset).toBeUndefined();
  });
});

describe("getIndependentExpenditures", () => {
  it("returns expenditures with committee data", async () => {
    const records = [
      {
        id: "ie-1",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        cycle: "2024",
        totalAmount: 100000,
        expenditureCount: 5,
        supportOppose: "S",
        committee: mockCommittee,
      },
    ];
    const { db } = createIndependentExpendituresMockDb(records);

    const result = await getIndependentExpenditures(db, "S000033", "2024");

    expect(result).toEqual(records);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no expenditures exist", async () => {
    const { db } = createIndependentExpendituresMockDb([]);

    const result = await getIndependentExpenditures(db, "NONEXIST", "2024");

    expect(result).toEqual([]);
  });

  it("passes where, with, and orderBy", async () => {
    const { db, findMany } = createIndependentExpendituresMockDb([]);

    await getIndependentExpenditures(db, "S000033", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
    expect(callArgs).toHaveProperty("with");
    expect(callArgs.with).toEqual({ committee: true });
    expect(callArgs).toHaveProperty("orderBy");
  });

  it("does not apply a limit", async () => {
    const { db, findMany } = createIndependentExpendituresMockDb([]);

    await getIndependentExpenditures(db, "S000033", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs.limit).toBeUndefined();
  });
});

describe("getCommitteeById", () => {
  it("returns committee data when found", async () => {
    const { db } = createCommitteesMockDb(mockCommittee);

    const result = await getCommitteeById(db, "C00123456");

    expect(result).toEqual(mockCommittee);
  });

  it("returns null when committee not found", async () => {
    const { db } = createCommitteesMockDb(undefined);

    const result = await getCommitteeById(db, "C99999999");

    expect(result).toBeNull();
  });

  it("filters by fecCommitteeId", async () => {
    const { db, findFirst } = createCommitteesMockDb(null);

    await getCommitteeById(db, "C00123456");

    const callArgs = findFirst.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
  });
});

describe("getCommitteeContributions", () => {
  it("returns contributions with legislator data", async () => {
    const records = [
      {
        id: "pac-1",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        recipientCommitteeId: null,
        cycle: "2024",
        totalAmount: 50000,
        contributionCount: 3,
        lastContributionDate: new Date(),
        legislator: mockLegislator,
      },
    ];
    const { db } = createPacContributionsMockDb(records);

    const result = await getCommitteeContributions(db, "C00123456", "2024");

    expect(result).toEqual(records);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when committee has no contributions", async () => {
    const { db } = createPacContributionsMockDb([]);

    const result = await getCommitteeContributions(db, "C99999999", "2024");

    expect(result).toEqual([]);
  });

  it("passes where, with, and orderBy", async () => {
    const { db, findMany } = createPacContributionsMockDb([]);

    await getCommitteeContributions(db, "C00123456", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
    expect(callArgs).toHaveProperty("with");
    expect(callArgs.with).toEqual({ legislator: true });
    expect(callArgs).toHaveProperty("orderBy");
  });
});

describe("getCommitteeExpenditures", () => {
  it("returns expenditures with legislator data", async () => {
    const records = [
      {
        id: "ie-1",
        bioguideId: "S000033",
        committeeId: "C00123456",
        fecId: "S4VT00033",
        cycle: "2024",
        totalAmount: 100000,
        expenditureCount: 5,
        supportOppose: "S",
        legislator: mockLegislator,
      },
    ];
    const { db } = createIndependentExpendituresMockDb(records);

    const result = await getCommitteeExpenditures(db, "C00123456", "2024");

    expect(result).toEqual(records);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when committee has no expenditures", async () => {
    const { db } = createIndependentExpendituresMockDb([]);

    const result = await getCommitteeExpenditures(db, "C99999999", "2024");

    expect(result).toEqual([]);
  });

  it("passes where, with, and orderBy", async () => {
    const { db, findMany } = createIndependentExpendituresMockDb([]);

    await getCommitteeExpenditures(db, "C00123456", "2024");

    const callArgs = findMany.mock.calls[0][0];
    expect(callArgs).toHaveProperty("where");
    expect(callArgs).toHaveProperty("with");
    expect(callArgs.with).toEqual({ legislator: true });
    expect(callArgs).toHaveProperty("orderBy");
  });
});

describe("campaign-finance query module exports", () => {
  it("exports all expected functions", async () => {
    const mod = await import("./campaign-finance");

    const expectedExports = [
      "getFinanceByMember",
      "getTopPacDonors",
      "getAllPacDonors",
      "getIndependentExpenditures",
      "getCommitteeById",
      "getCommitteeContributions",
      "getCommitteeExpenditures",
    ];

    for (const name of expectedExports) {
      expect(mod).toHaveProperty(name);
      expect(typeof mod[name as keyof typeof mod]).toBe("function");
    }
  });
});
