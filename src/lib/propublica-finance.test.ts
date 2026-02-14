import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCandidateByFecId, delay } from "./propublica-finance";

const MOCK_API_KEY = "test-propublica-key";
const mockFetch = vi.fn();

const mockCandidateResponse = {
  status: "OK",
  results: [
    {
      id: "S4VT00033",
      name: "SANDERS, BERNARD",
      party: "DEM",
      fec_uri: "https://www.fec.gov/data/candidate/S4VT00033/",
      total_receipts: 5482917.42,
      total_disbursements: 3219845.67,
      cash_on_hand_end_period: 2263071.75,
      total_from_pacs: 0,
      total_from_individuals: 5482917.42,
      debts_owed: 0,
    },
  ],
};

describe("propublica-finance", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCandidateByFecId", () => {
    it("parses a successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandidateResponse,
      });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");

      expect(result).toEqual({
        totalReceipts: 5482917.42,
        totalDisbursements: 3219845.67,
        cashOnHand: 2263071.75,
        totalFromPACs: 0,
        totalFromIndividuals: 5482917.42,
        debtsOwed: 0,
        fecUri: "https://www.fec.gov/data/candidate/S4VT00033/",
      });
    });

    it("constructs the correct URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandidateResponse,
      });

      await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.propublica.org/campaign-finance/v1/2024/candidates/S4VT00033.json",
        expect.any(Object)
      );
    });

    it("sets the X-API-Key header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandidateResponse,
      });

      await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        headers: { "X-API-Key": MOCK_API_KEY },
      });
    });

    it("returns null on 404", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null on 429 (rate limited)", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null on 500", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null when results array is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "OK", results: [] }),
      });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null for malformed response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: "shape" }),
      });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("returns null when candidate has missing fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ id: "S4VT00033", name: "SANDERS" }],
        }),
      });

      const result = await getCandidateByFecId(MOCK_API_KEY, "2024", "S4VT00033");
      expect(result).toBeNull();
    });

    it("throws on empty API key", async () => {
      await expect(getCandidateByFecId("", "2024", "S4VT00033")).rejects.toThrow(
        "ProPublica API key is required"
      );
    });

    it("throws on invalid cycle format", async () => {
      await expect(getCandidateByFecId(MOCK_API_KEY, "24", "S4VT00033")).rejects.toThrow(
        "Invalid cycle: 24"
      );
    });

    it("throws on invalid FEC ID format", async () => {
      await expect(getCandidateByFecId(MOCK_API_KEY, "2024", "invalid")).rejects.toThrow(
        "Invalid FEC ID: invalid"
      );
    });
  });

  describe("delay", () => {
    it("resolves after the specified time", async () => {
      vi.useFakeTimers();

      const promise = delay(100);
      vi.advanceTimersByTime(100);
      await promise;

      vi.useRealTimers();
    });
  });
});
