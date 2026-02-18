import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IndependentExpenditureItem } from "@/lib/fec-finance";

const mockFetchIndependentExpenditures =
  vi.fn<(fecId: string, cycle: string, apiKey: string) => Promise<IndependentExpenditureItem[]>>();
const mockCreateRateLimiter = vi.fn();
const mockThrottle = vi.fn<() => Promise<void>>();

vi.mock("@/lib/fec-finance", () => ({
  fetchIndependentExpenditures: (...args: [string, string, string]) =>
    mockFetchIndependentExpenditures(...args),
  createRateLimiter: (...args: [number]) => mockCreateRateLimiter(...args),
}));

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockOnConflictDoNothing = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();

vi.mock("@/db/schema", () => ({
  legislators: {
    bioguideId: "bioguide_id",
    fecIds: "fec_ids",
  },
  independentExpenditures: {
    bioguideId: "bioguide_id",
    committeeId: "committee_id",
    cycle: "cycle",
    supportOppose: "support_oppose",
  },
  committees: {
    fecCommitteeId: "fec_committee_id",
  },
}));

function createMockDb() {
  mockOnConflictDoUpdate.mockReturnValue(undefined);
  mockOnConflictDoNothing.mockReturnValue(undefined);
  mockValues.mockReturnValue({
    onConflictDoUpdate: mockOnConflictDoUpdate,
    onConflictDoNothing: mockOnConflictDoNothing,
  });
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

function makeExpenditureItem(
  overrides: Partial<IndependentExpenditureItem> = {}
): IndependentExpenditureItem {
  return {
    committeeId: "C00578997",
    committeeName: "SENATE LEADERSHIP FUND",
    total: 1500000,
    supportOppose: "S",
    count: 25,
    ...overrides,
  };
}

describe("syncIndependentExpenditures", () => {
  let db: ReturnType<typeof createMockDb>;
  let syncIndependentExpenditures: typeof import("./sync-independent-expenditures").syncIndependentExpenditures;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockThrottle.mockResolvedValue(undefined);
    mockCreateRateLimiter.mockReturnValue(mockThrottle);
    mockFetchIndependentExpenditures.mockResolvedValue([]);
    db = createMockDb();
    const mod = await import("./sync-independent-expenditures");
    syncIndependentExpenditures = mod.syncIndependentExpenditures;
  });

  it("processes legislators with FEC IDs", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])]);
    mockFetchIndependentExpenditures.mockResolvedValueOnce([makeExpenditureItem()]);

    const result = await syncIndependentExpenditures(db, "test-key", "2026");

    expect(result.processed).toBe(1);
    expect(result.expendituresInserted).toBeGreaterThanOrEqual(1);
  });

  it("uses the last FEC ID from the array", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033", "P60007168"])]);

    await syncIndependentExpenditures(db, "test-key", "2026");

    expect(mockFetchIndependentExpenditures).toHaveBeenCalledWith("P60007168", "2026", "test-key");
  });

  it("skips legislators without FEC IDs", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const result = await syncIndependentExpenditures(db, "test-key", "2026");

    expect(result.processed).toBe(0);
    expect(mockFetchIndependentExpenditures).not.toHaveBeenCalled();
  });

  it("upserts committee metadata for each expenditure", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])]);
    mockFetchIndependentExpenditures.mockResolvedValueOnce([
      makeExpenditureItem({ committeeId: "C00578997", committeeName: "SENATE LEADERSHIP FUND" }),
    ]);

    await syncIndependentExpenditures(db, "test-key", "2026");

    expect(mockInsert).toHaveBeenCalled();
  });

  it("counts failures when API throws", async () => {
    mockWhere.mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])]);
    mockFetchIndependentExpenditures.mockRejectedValueOnce(new Error("API error"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await syncIndependentExpenditures(db, "test-key", "2026");
    errorSpy.mockRestore();

    expect(result.failed).toBe(1);
  });

  it("creates rate limiter with 900 requests per hour", async () => {
    mockWhere.mockResolvedValueOnce([]);

    await syncIndependentExpenditures(db, "test-key", "2026");

    expect(mockCreateRateLimiter).toHaveBeenCalledWith(900);
  });

  it("handles multiple legislators", async () => {
    mockWhere.mockResolvedValueOnce([
      makeLegislatorRow("S000033", ["S4VT00033"]),
      makeLegislatorRow("P000197", ["H8CA05035"]),
    ]);
    mockFetchIndependentExpenditures
      .mockResolvedValueOnce([makeExpenditureItem()])
      .mockResolvedValueOnce([]);

    const result = await syncIndependentExpenditures(db, "test-key", "2026");

    expect(result.processed).toBe(2);
    expect(mockFetchIndependentExpenditures).toHaveBeenCalledTimes(2);
  });
});
