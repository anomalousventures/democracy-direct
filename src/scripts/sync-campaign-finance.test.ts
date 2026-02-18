import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CandidateFinanceData, FecOffice } from "@/lib/fec-finance";

const mockFetchAllCandidateTotals =
  vi.fn<
    (office: FecOffice, cycle: string, apiKey: string) => Promise<Map<string, CandidateFinanceData>>
  >();
const mockDelay = vi.fn<(ms: number) => Promise<void>>();

vi.mock("@/lib/fec-finance", () => ({
  fetchAllCandidateTotals: (...args: [FecOffice, string, string]) =>
    mockFetchAllCandidateTotals(...args),
  delay: (...args: [number]) => mockDelay(...args),
}));

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/db/schema", () => ({
  legislators: {
    bioguideId: "bioguide_id",
    fecIds: "fec_ids",
  },
  campaignFinance: {
    bioguideId: "bioguide_id",
    cycle: "cycle",
  },
}));

function createMockDb() {
  mockOnConflictDoUpdate.mockReturnValue(undefined);
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockInsert.mockReturnValue({ values: mockValues });
  mockWhere.mockResolvedValue([]);
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  return {
    select: mockSelect,
    insert: mockInsert,
  } as unknown as import("@/db/client").Database;
}

function makeLegislatorRow(bioguideId: string, fecIds: string[]) {
  return { bioguideId, fecIds };
}

function makeFinanceData(overrides: Partial<CandidateFinanceData> = {}): CandidateFinanceData {
  return {
    totalReceipts: 1000000,
    totalDisbursements: 800000,
    cashOnHand: 200000,
    totalFromPACs: 300000,
    totalFromIndividuals: 700000,
    debtsOwed: 50000,
    fecUri: "https://www.fec.gov/data/candidate/H8CA05035/",
    ...overrides,
  };
}

function makeBulkData(
  entries: Array<{ fecId: string; data?: Partial<CandidateFinanceData> }>
): Map<string, CandidateFinanceData> {
  const map = new Map<string, CandidateFinanceData>();
  for (const entry of entries) {
    map.set(entry.fecId, makeFinanceData(entry.data));
  }
  return map;
}

describe("syncCampaignFinance", () => {
  let db: ReturnType<typeof createMockDb>;
  let syncCampaignFinance: typeof import("./sync-campaign-finance").syncCampaignFinance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDelay.mockResolvedValue(undefined);
    mockFetchAllCandidateTotals.mockResolvedValue(new Map());
    db = createMockDb();
    const mod = await import("./sync-campaign-finance");
    syncCampaignFinance = mod.syncCampaignFinance;
  });

  it("fetches bulk data for Senate and House", async () => {
    mockWhere.mockResolvedValueOnce([]);

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockFetchAllCandidateTotals).toHaveBeenCalledWith("S", "2026", "test-key");
    expect(mockFetchAllCandidateTotals).toHaveBeenCalledWith("H", "2026", "test-key");
    expect(mockFetchAllCandidateTotals).toHaveBeenCalledTimes(2);
  });

  it("matches legislators to bulk data by FEC ID", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(makeBulkData([{ fecId: "H8CA05035" }]));
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.succeeded).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("uses the last FEC ID from the array (most recent)", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(makeBulkData([{ fecId: "P60007168" }]));
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033", "P60007168"])]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.succeeded).toBe(1);
  });

  it("counts unmatched legislators as skipped", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(new Map());
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("T000123", ["H0XX00001"])]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.skipped).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("filters out legislators without FEC IDs", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.processed).toBe(0);
    expect(result.succeeded).toBe(0);
  });

  it("counts batch upsert failures", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(makeBulkData([{ fecId: "H0YY00001" }]));
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("E000123", ["H0YY00001"])]);
    mockInsert.mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await syncCampaignFinance(db, "test-key", "2026");
    errorSpy.mockRestore();

    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
  });

  it("upserts on conflict with correct target", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(makeBulkData([{ fecId: "H8CA05035" }]));
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.arrayContaining(["bioguide_id", "cycle"]),
      })
    );
  });

  it("processes multiple legislators with mixed results", async () => {
    mockFetchAllCandidateTotals.mockResolvedValue(
      makeBulkData([{ fecId: "H0AA00001" }, { fecId: "H0CC00003" }])
    );
    mockWhere.mockResolvedValueOnce([
      makeLegislatorRow("A000001", ["H0AA00001"]),
      makeLegislatorRow("B000002", ["H0BB00002"]),
      makeLegislatorRow("C000003", ["H0CC00003"]),
    ]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.processed).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("passes correct finance data to the batch insert", async () => {
    const financeData = makeFinanceData({
      totalReceipts: 5000000,
      totalDisbursements: 4000000,
      cashOnHand: 1000000,
      totalFromPACs: 2000000,
      totalFromIndividuals: 3000000,
      debtsOwed: 100000,
      fecUri: "https://www.fec.gov/data/candidate/H8CA05035/",
    });
    mockFetchAllCandidateTotals.mockResolvedValue(new Map([["H8CA05035", financeData]]));
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockValues).toHaveBeenCalledWith([
      expect.objectContaining({
        bioguideId: "P000197",
        fecId: "H8CA05035",
        cycle: "2026",
        totalReceipts: 5000000,
        totalDisbursements: 4000000,
        cashOnHand: 1000000,
        totalFromPACs: 2000000,
        totalFromIndividuals: 3000000,
        debtsOwed: 100000,
        sourceUrl: "https://www.fec.gov/data/candidate/H8CA05035/",
      }),
    ]);
  });

  it("merges Senate and House bulk data", async () => {
    const senateData = makeBulkData([{ fecId: "S4VT00033" }]);
    const houseData = makeBulkData([{ fecId: "H8CA05035" }]);

    mockFetchAllCandidateTotals.mockResolvedValueOnce(senateData).mockResolvedValueOnce(houseData);

    mockWhere.mockResolvedValueOnce([
      makeLegislatorRow("S000033", ["S4VT00033"]),
      makeLegislatorRow("P000197", ["H8CA05035"]),
    ]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.succeeded).toBe(2);
  });
});
