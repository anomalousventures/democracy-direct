import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PacContributionItem } from "@/lib/fec-finance";

const mockFetchCandidateCommittee =
  vi.fn<(fecId: string, cycle: string, apiKey: string) => Promise<string | null>>();
const mockFetchPacContributions =
  vi.fn<(committeeId: string, cycle: string, apiKey: string) => Promise<PacContributionItem[]>>();
const mockCreateRateLimiter = vi.fn();
const mockThrottle = vi.fn<() => Promise<void>>();

vi.mock("@/lib/fec-finance", () => ({
  fetchCandidateCommittee: (...args: [string, string, string]) =>
    mockFetchCandidateCommittee(...args),
  fetchPacContributions: (...args: [string, string, string]) => mockFetchPacContributions(...args),
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
  candidateCommittees: {
    fecId: "fec_id",
    cycle: "cycle",
  },
  pacContributions: {
    bioguideId: "bioguide_id",
    committeeId: "committee_id",
    cycle: "cycle",
  },
  committees: {
    fecCommitteeId: "fec_committee_id",
  },
  syncCursors: {
    id: "id",
    currentOffset: "current_offset",
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

function makeContributionItem(overrides: Partial<PacContributionItem> = {}): PacContributionItem {
  return {
    contributorId: "C00000935",
    contributorName: "NATIONAL BEER WHOLESALERS",
    amount: 5000,
    date: "2025-06-15",
    memoCode: null,
    ...overrides,
  };
}

describe("syncPacContributions", () => {
  let db: ReturnType<typeof createMockDb>;
  let syncPacContributions: typeof import("./sync-pac-contributions").syncPacContributions;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockThrottle.mockResolvedValue(undefined);
    mockCreateRateLimiter.mockReturnValue(mockThrottle);
    mockFetchCandidateCommittee.mockResolvedValue(null);
    mockFetchPacContributions.mockResolvedValue([]);
    db = createMockDb();
    const mod = await import("./sync-pac-contributions");
    syncPacContributions = mod.syncPacContributions;
  });

  it("fetches candidate committee for each legislator", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce("C00401224");
    mockFetchPacContributions.mockResolvedValueOnce([]);

    const result = await syncPacContributions(db, "test-key", "2026");

    expect(mockFetchCandidateCommittee).toHaveBeenCalledWith("S4VT00033", "2026", "test-key");
    expect(result.processed).toBe(1);
  });

  it("skips committee lookup when candidate_committees entry exists", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ committeeId: "C00401224" }]);
    mockFetchPacContributions.mockResolvedValueOnce([]);

    await syncPacContributions(db, "test-key", "2026");

    expect(mockFetchCandidateCommittee).not.toHaveBeenCalled();
  });

  it("fetches PAC contributions for the principal committee", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce("C00401224");
    mockFetchPacContributions.mockResolvedValueOnce([
      makeContributionItem({ contributorId: "C00000935", amount: 5000 }),
      makeContributionItem({ contributorId: "C00000935", amount: 2500 }),
    ]);

    const result = await syncPacContributions(db, "test-key", "2026");

    expect(mockFetchPacContributions).toHaveBeenCalledWith("C00401224", "2026", "test-key");
    expect(result.contributionsInserted).toBeGreaterThanOrEqual(1);
  });

  it("filters out memo_code='X' transactions", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce("C00401224");
    mockFetchPacContributions.mockResolvedValueOnce([
      makeContributionItem({ contributorId: "C00000935", amount: 5000, memoCode: null }),
      makeContributionItem({ contributorId: "C00000936", amount: 2500, memoCode: "X" }),
    ]);

    await syncPacContributions(db, "test-key", "2026");

    // The memo_code='X' item should be filtered out
    expect(mockInsert).toHaveBeenCalled();
  });

  it("aggregates multiple contributions from the same PAC", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce("C00401224");
    mockFetchPacContributions.mockResolvedValueOnce([
      makeContributionItem({ contributorId: "C00000935", amount: 5000, date: "2025-06-15" }),
      makeContributionItem({ contributorId: "C00000935", amount: 2500, date: "2025-03-10" }),
    ]);

    const result = await syncPacContributions(db, "test-key", "2026");

    expect(result.contributionsInserted).toBe(1);
  });

  it("skips legislators without FEC IDs", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const result = await syncPacContributions(db, "test-key", "2026");

    expect(result.processed).toBe(0);
    expect(mockFetchCandidateCommittee).not.toHaveBeenCalled();
  });

  it("uses last FEC ID from array", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033", "P60007168"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce(null);

    await syncPacContributions(db, "test-key", "2026");

    expect(mockFetchCandidateCommittee).toHaveBeenCalledWith("P60007168", "2026", "test-key");
  });

  it("creates rate limiter with 900 requests per hour", async () => {
    mockWhere.mockResolvedValueOnce([]);

    await syncPacContributions(db, "test-key", "2026");

    expect(mockCreateRateLimiter).toHaveBeenCalledWith(900);
  });

  it("skips legislator when no committee found", async () => {
    mockWhere
      .mockResolvedValueOnce([makeLegislatorRow("S000033", ["S4VT00033"])])
      .mockResolvedValueOnce([]);
    mockFetchCandidateCommittee.mockResolvedValueOnce(null);

    const result = await syncPacContributions(db, "test-key", "2026");

    expect(result.committeesFound).toBe(0);
    expect(mockFetchPacContributions).not.toHaveBeenCalled();
  });
});
