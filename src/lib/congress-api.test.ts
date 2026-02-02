import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createCongressClient,
  CongressApiError,
  getCurrentCongress,
  getCurrentSession,
  type CongressClient,
} from "./congress-api";

const mockFetch = vi.fn();

describe("CongressClient", () => {
  let client: CongressClient;

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    client = createCongressClient({ apiKey: "test-api-key" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getHouseVote fetches a House vote by congress, session, and roll call", async () => {
    const mockResponse = {
      houseRollCallVote: {
        congress: 119,
        sessionNumber: 1,
        rollCallNumber: 123,
        result: "Passed",
        voteQuestion: "On Passage",
        voteType: "Yea-And-Nay",
        startDate: "2025-01-15T14:30:00-05:00",
        votePartyTotal: [
          { voteParty: "R", yeaTotal: 120, nayTotal: 100, presentTotal: 0, notVotingTotal: 5 },
          { voteParty: "D", yeaTotal: 100, nayTotal: 100, presentTotal: 5, notVotingTotal: 5 },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.getHouseVote(119, 1, 123);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.congress.gov/v3/house-vote/119/1/123?api_key=test-api-key",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      })
    );
    expect(result.houseRollCallVote.rollCallNumber).toBe(123);
  });

  it("listHouseVotes lists House votes with pagination", async () => {
    const mockResponse = {
      houseRollCallVotes: [
        {
          congress: 119,
          sessionNumber: 1,
          rollCallNumber: 1,
          startDate: "2025-01-03T12:00:00-05:00",
          result: "Passed",
        },
      ],
      pagination: { count: 100, next: "https://api.congress.gov/v3/house-vote?offset=20" },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.listHouseVotes(119, 1, { limit: 20 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v3/house-vote/119/1"),
      expect.any(Object)
    );
    expect(result.houseRollCallVotes).toHaveLength(1);
    expect(result.pagination?.count).toBe(100);
  });

  it("listBills supports fromDateTime for incremental sync", async () => {
    const mockResponse = {
      bills: [
        {
          congress: 119,
          type: "HR",
          number: "1234",
          title: "Test Bill",
          url: "https://api.congress.gov/v3/bill/119/hr/1234",
        },
      ],
      pagination: { count: 50 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const fromDateTime = "2025-01-01T00:00:00Z";
    const result = await client.listBills({ fromDateTime, limit: 100 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`fromDateTime=${encodeURIComponent(fromDateTime)}`),
      expect.any(Object)
    );
    expect(result.bills).toHaveLength(1);
  });

  it("listBills filters by specific congress", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bills: [], pagination: { count: 0 } }),
    });

    await client.listBills({ congress: 118 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v3/bill/118"),
      expect.any(Object)
    );
  });

  it("getBill fetches a specific bill", async () => {
    const mockResponse = {
      bill: {
        congress: 119,
        type: "HR",
        number: 1234,
        title: "Test Bill",
        introducedDate: "2025-01-10",
        latestAction: { actionDate: "2025-01-15", text: "Referred to committee" },
        policyArea: { name: "Health" },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.getBill(119, "hr", 1234);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v3/bill/119/hr/1234"),
      expect.any(Object)
    );
    expect(result.bill.title).toBe("Test Bill");
  });

  it("getBillSummaries fetches bill summaries", async () => {
    const mockResponse = {
      summaries: [
        {
          versionCode: "00",
          actionDate: "2025-01-10",
          actionDesc: "Introduced in House",
          text: "<p>This bill does something.</p>",
          updateDate: "2025-01-10T12:00:00Z",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.getBillSummaries(119, "hr", 1234);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v3/bill/119/hr/1234/summaries"),
      expect.any(Object)
    );
    expect(result.summaries).toHaveLength(1);
  });

  it("throws CongressApiError on non-OK response with status code", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    });

    try {
      await client.getHouseVote(119, 1, 1);
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(CongressApiError);
      expect((error as CongressApiError).statusCode).toBe(429);
    }
  });

  it("wraps network errors in CongressApiError", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(client.getHouseVote(119, 1, 1)).rejects.toThrow(CongressApiError);
  });

  it("delays between requests when rate limiting is enabled", async () => {
    const clientWithRateLimit = createCongressClient({
      apiKey: "test-api-key",
      minDelayMs: 50,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ houseRollCallVotes: [], pagination: { count: 0 } }),
    });

    const start = Date.now();
    await clientWithRateLimit.listHouseVotes(119, 1);
    await clientWithRateLimit.listHouseVotes(119, 1);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});

describe("CongressApiError", () => {
  it("creates error with message and optional status code", () => {
    const errorWithStatus = new CongressApiError("HTTP error", 404);
    expect(errorWithStatus.message).toBe("HTTP error");
    expect(errorWithStatus.statusCode).toBe(404);
    expect(errorWithStatus.name).toBe("CongressApiError");

    const errorWithoutStatus = new CongressApiError("Network failure");
    expect(errorWithoutStatus.statusCode).toBeUndefined();
  });
});

describe("getCurrentCongress", () => {
  it("returns the correct congress based on current year", () => {
    const congress = getCurrentCongress();
    const year = new Date().getFullYear();
    const expectedCongress = Math.floor((year - 1789) / 2) + 1;
    expect(congress).toBe(expectedCongress);
  });
});

describe("getCurrentSession", () => {
  it("returns 1 for odd years and 2 for even years", () => {
    const session = getCurrentSession();
    const year = new Date().getFullYear();
    const expectedSession = year % 2 === 1 ? 1 : 2;
    expect(session).toBe(expectedSession);
  });
});
