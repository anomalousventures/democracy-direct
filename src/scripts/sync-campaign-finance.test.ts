import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CandidateFinanceData } from "@/lib/fec-finance";

const mockGetCandidateFinance =
  vi.fn<(fecId: string, cycle: string, apiKey: string) => Promise<CandidateFinanceData | null>>();
const mockDelay = vi.fn<(ms: number) => Promise<void>>();

vi.mock("@/lib/fec-finance", () => ({
  getCandidateFinance: (...args: [string, string, string]) => mockGetCandidateFinance(...args),
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
    fecUri: "https://api.open.fec.gov/candidate/H8CA05035",
    ...overrides,
  };
}

describe("syncCampaignFinance", () => {
  let db: ReturnType<typeof createMockDb>;
  let syncCampaignFinance: typeof import("./sync-campaign-finance").syncCampaignFinance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDelay.mockResolvedValue(undefined);
    db = createMockDb();
    const mod = await import("./sync-campaign-finance");
    syncCampaignFinance = mod.syncCampaignFinance;
  });

  it("syncs a legislator with a single FEC ID", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);
    mockGetCandidateFinance.mockResolvedValueOnce(makeFinanceData());

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);

    expect(mockGetCandidateFinance).toHaveBeenCalledWith("H8CA05035", "2026", "test-key");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("uses the last FEC ID from the array (most recent)", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033", "P60007168"])]);
    mockGetCandidateFinance.mockResolvedValueOnce(makeFinanceData());

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockGetCandidateFinance).toHaveBeenCalledWith("P60007168", "2026", "test-key");
  });

  it("filters out legislators without FEC IDs", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const result = await syncCampaignFinance(db, "test-key", "2026");

    expect(result.processed).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(mockGetCandidateFinance).not.toHaveBeenCalled();
  });

  it("skips legislators when API returns null", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("T000123", ["H0XX00001"])]);
    mockGetCandidateFinance.mockResolvedValueOnce(null);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await syncCampaignFinance(db, "test-key", "2026");
    warnSpy.mockRestore();

    expect(result.skipped).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("counts failures when API throws", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("E000123", ["H0YY00001"])]);
    mockGetCandidateFinance.mockRejectedValueOnce(new Error("Network error"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await syncCampaignFinance(db, "test-key", "2026");
    errorSpy.mockRestore();

    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
  });

  it("upserts existing records on conflict", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);
    mockGetCandidateFinance.mockResolvedValueOnce(makeFinanceData());

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockValues).toHaveBeenCalled();
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.arrayContaining(["bioguide_id", "cycle"]),
      })
    );
  });

  it("delays between API requests", async () => {
    mockWhere.mockResolvedValueOnce([
      makeLegislatorRow("A000001", ["H0AA00001"]),
      makeLegislatorRow("B000002", ["H0BB00002"]),
      makeLegislatorRow("C000003", ["H0CC00003"]),
    ]);
    mockGetCandidateFinance.mockResolvedValue(makeFinanceData());

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockDelay).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenCalledWith(250);
  });

  it("does not delay after the last legislator", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("A000001", ["H0AA00001"])]);
    mockGetCandidateFinance.mockResolvedValue(makeFinanceData());

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockDelay).not.toHaveBeenCalled();
  });

  it("processes multiple legislators and returns correct totals", async () => {
    mockWhere.mockResolvedValueOnce([
      makeLegislatorRow("A000001", ["H0AA00001"]),
      makeLegislatorRow("B000002", ["H0BB00002"]),
      makeLegislatorRow("C000003", ["H0CC00003"]),
    ]);
    mockGetCandidateFinance
      .mockResolvedValueOnce(makeFinanceData())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeFinanceData());

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await syncCampaignFinance(db, "test-key", "2026");
    warnSpy.mockRestore();

    expect(result.processed).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("passes correct finance data to the insert", async () => {
    const financeData = makeFinanceData({
      totalReceipts: 5000000,
      totalDisbursements: 4000000,
      cashOnHand: 1000000,
      totalFromPACs: 2000000,
      totalFromIndividuals: 3000000,
      debtsOwed: 100000,
      fecUri: "https://api.open.fec.gov/candidate/H8CA05035",
    });
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("P000197", ["H8CA05035"])]);
    mockGetCandidateFinance.mockResolvedValueOnce(financeData);

    await syncCampaignFinance(db, "test-key", "2026");

    expect(mockValues).toHaveBeenCalledWith(
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
        sourceUrl: "https://api.open.fec.gov/candidate/H8CA05035",
      })
    );
  });

  it("logs progress at intervals", async () => {
    const legislators = Array.from({ length: 60 }, (_, i) => {
      const id = String(i).padStart(6, "0");
      return makeLegislatorRow(`X${id}`, [`H0XX${id.slice(0, 5)}`]);
    });
    mockWhere.mockResolvedValueOnce(legislators);
    mockGetCandidateFinance.mockResolvedValue(makeFinanceData());

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await syncCampaignFinance(db, "test-key", "2026");

    const progressLogs = logSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("Progress:")
    );
    expect(progressLogs.length).toBe(1);
    logSpy.mockRestore();
  });
});
