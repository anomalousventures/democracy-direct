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

  describe("getHouseVote", () => {
    it("fetches a House vote by congress, session, and roll call", async () => {
      const mockResponse = {
        vote: {
          congress: 119,
          session: 1,
          chamber: "House",
          rollNumber: 123,
          date: "2025-01-15",
          time: "14:30:00",
          question: "On Passage",
          result: "Passed",
          description: "Test Bill",
          totals: {
            yea: 220,
            nay: 200,
            notVoting: 10,
            present: 5,
          },
          members: [
            {
              bioguideId: "A000001",
              party: "D",
              state: "CA",
              name: "Test Member",
              vote: "Yea",
            },
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
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("throws CongressApiError on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(client.getHouseVote(119, 1, 999)).rejects.toThrow(CongressApiError);
    });
  });

  describe("listHouseVotes", () => {
    it("lists House votes with pagination", async () => {
      const mockResponse = {
        votes: [
          {
            congress: 119,
            session: 1,
            rollNumber: 1,
            date: "2025-01-03",
          },
        ],
        pagination: {
          count: 100,
          next: "https://api.congress.gov/v3/house-vote?offset=20",
        },
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
      expect(result.votes).toHaveLength(1);
      expect(result.pagination?.count).toBe(100);
    });
  });

  describe("listBills", () => {
    it("lists bills with fromDateTime for incremental sync", async () => {
      const mockResponse = {
        bills: [
          {
            congress: 119,
            type: "HR",
            number: 1234,
            title: "Test Bill",
            introducedDate: "2025-01-10",
            url: "https://api.congress.gov/v3/bill/119/hr/1234",
          },
        ],
        pagination: {
          count: 50,
        },
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

    it("lists bills for a specific congress", async () => {
      const mockResponse = {
        bills: [],
        pagination: { count: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.listBills({ congress: 118 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v3/bill/118"),
        expect.any(Object)
      );
    });
  });

  describe("getBill", () => {
    it("fetches a specific bill", async () => {
      const mockResponse = {
        bill: {
          congress: 119,
          type: "HR",
          number: 1234,
          title: "Test Bill",
          introducedDate: "2025-01-10",
          latestAction: {
            actionDate: "2025-01-15",
            text: "Referred to committee",
          },
          policyArea: {
            name: "Health",
          },
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
  });

  describe("getBillSummaries", () => {
    it("fetches bill summaries", async () => {
      const mockResponse = {
        summaries: [
          {
            versionCode: "00",
            actionDate: "2025-01-10",
            actionDesc: "Introduced in House",
            text: "<p>This bill does something important.</p>",
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
  });

  describe("rate limiting", () => {
    it("delays between requests when rate limiting is enabled", async () => {
      const clientWithRateLimit = createCongressClient({
        apiKey: "test-api-key",
        minDelayMs: 50,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ votes: [], pagination: { count: 0 } }),
      });

      const start = Date.now();
      await clientWithRateLimit.listHouseVotes(119, 1);
      await clientWithRateLimit.listHouseVotes(119, 1);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("error handling", () => {
    it("wraps network errors in CongressApiError", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.getHouseVote(119, 1, 1)).rejects.toThrow(CongressApiError);
    });

    it("includes status code in error for HTTP errors", async () => {
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
  });
});

describe("CongressApiError", () => {
  it("creates error with message and status code", () => {
    const error = new CongressApiError("Test error", 404);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("CongressApiError");
  });

  it("works without status code", () => {
    const error = new CongressApiError("Network failure");
    expect(error.message).toBe("Network failure");
    expect(error.statusCode).toBeUndefined();
  });
});

describe("getCurrentCongress", () => {
  it("returns the correct congress for current year", () => {
    const congress = getCurrentCongress();
    const year = new Date().getFullYear();
    const expectedCongress = Math.floor((year - 1789) / 2) + 1;
    expect(congress).toBe(expectedCongress);
  });

  it("returns 119 for 2025-2026", () => {
    const congress = getCurrentCongress();
    expect(congress).toBeGreaterThanOrEqual(119);
  });
});

describe("getCurrentSession", () => {
  it("returns 1 for odd years and 2 for even years", () => {
    const session = getCurrentSession();
    const year = new Date().getFullYear();
    const expectedSession = year % 2 === 1 ? 1 : 2;
    expect(session).toBe(expectedSession);
  });

  it("returns either 1 or 2", () => {
    const session = getCurrentSession();
    expect([1, 2]).toContain(session);
  });
});
