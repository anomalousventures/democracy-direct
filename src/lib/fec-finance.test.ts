import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCandidateFinance,
  fetchAllCandidateTotals,
  fetchCandidateCommittee,
  fetchPacContributions,
  fetchIndependentExpenditures,
  fetchCommitteeDetails,
  createRateLimiter,
  delay,
} from "./fec-finance";

const MOCK_API_KEY = "test-fec-key";
const mockFetch = vi.fn();

const mockFecResponse = {
  results: [
    {
      receipts: 5482917.42,
      disbursements: 3219845.67,
      last_cash_on_hand_end_period: 2263071.75,
      other_political_committee_contributions: 0,
      individual_contributions: 5482917.42,
      last_debts_owed_by_committee: 0,
    },
  ],
};

function makeBulkPage(
  candidates: Array<{ candidate_id: string; receipts: number }>,
  page: number,
  pages: number
) {
  return {
    ok: true,
    json: async () => ({
      results: candidates.map((c) => ({
        candidate_id: c.candidate_id,
        receipts: c.receipts,
        disbursements: 0,
        cash_on_hand_end_period: "0.00",
        other_political_committee_contributions: 0,
        individual_itemized_contributions: 0,
        debts_owed_by_committee: "0.00",
      })),
      pagination: { page, pages },
    }),
  };
}

describe("fec-finance", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCandidateFinance", () => {
    it("maps FEC response fields to CandidateFinanceData", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFecResponse,
      });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);

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

    it("constructs the correct FEC API URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFecResponse,
      });

      await getCandidateFinance("S4VT00033", "2026", MOCK_API_KEY);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open.fec.gov/v1/candidate/S4VT00033/totals/?cycle=2026&api_key=test-fec-key"
      );
    });

    it("constructs fecUri from the candidate ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFecResponse,
      });

      const result = await getCandidateFinance("H8CA52109", "2024", MOCK_API_KEY);

      expect(result?.fecUri).toBe("https://www.fec.gov/data/candidate/H8CA52109/");
    });

    it("defaults null numeric fields to 0", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              receipts: null,
              disbursements: null,
              last_cash_on_hand_end_period: null,
              other_political_committee_contributions: null,
              individual_contributions: null,
              last_debts_owed_by_committee: null,
            },
          ],
        }),
      });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);

      expect(result).toEqual({
        totalReceipts: 0,
        totalDisbursements: 0,
        cashOnHand: 0,
        totalFromPACs: 0,
        totalFromIndividuals: 0,
        debtsOwed: 0,
        fecUri: "https://www.fec.gov/data/candidate/S4VT00033/",
      });
    });

    it("defaults missing numeric fields to 0", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{}] }),
      });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);

      expect(result).toEqual({
        totalReceipts: 0,
        totalDisbursements: 0,
        cashOnHand: 0,
        totalFromPACs: 0,
        totalFromIndividuals: 0,
        debtsOwed: 0,
        fecUri: "https://www.fec.gov/data/candidate/S4VT00033/",
      });
    });

    it("returns null on empty results array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("returns null on 404", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("returns null on 429 (rate limited)", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("returns null for malformed response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: "shape" }),
      });

      const result = await getCandidateFinance("S4VT00033", "2024", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("throws on empty API key", async () => {
      await expect(getCandidateFinance("S4VT00033", "2024", "")).rejects.toThrow(
        "FEC API key is required"
      );
    });

    it("throws on invalid cycle format", async () => {
      await expect(getCandidateFinance("S4VT00033", "24", MOCK_API_KEY)).rejects.toThrow(
        "Invalid cycle: 24"
      );
    });

    it("throws on invalid FEC ID format", async () => {
      await expect(getCandidateFinance("invalid", "2024", MOCK_API_KEY)).rejects.toThrow(
        "Invalid FEC ID: invalid"
      );
    });
  });

  describe("fetchAllCandidateTotals", () => {
    it("fetches a single page and returns a map keyed by candidate_id", async () => {
      mockFetch.mockResolvedValueOnce(
        makeBulkPage(
          [
            { candidate_id: "S4VT00033", receipts: 5000000 },
            { candidate_id: "S2NY00188", receipts: 3000000 },
          ],
          1,
          1
        )
      );

      const result = await fetchAllCandidateTotals("S", "2026", MOCK_API_KEY);

      expect(result.size).toBe(2);
      expect(result.get("S4VT00033")?.totalReceipts).toBe(5000000);
      expect(result.get("S2NY00188")?.totalReceipts).toBe(3000000);
    });

    it("paginates through multiple pages", async () => {
      mockFetch
        .mockResolvedValueOnce(makeBulkPage([{ candidate_id: "S4VT00033", receipts: 100 }], 1, 3))
        .mockResolvedValueOnce(makeBulkPage([{ candidate_id: "S2NY00188", receipts: 200 }], 2, 3))
        .mockResolvedValueOnce(makeBulkPage([{ candidate_id: "H8CA52109", receipts: 300 }], 3, 3));

      const result = await fetchAllCandidateTotals("H", "2026", MOCK_API_KEY);

      expect(result.size).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("constructs the correct URL with office and cycle", async () => {
      mockFetch.mockResolvedValueOnce(makeBulkPage([], 1, 1));

      await fetchAllCandidateTotals("S", "2026", MOCK_API_KEY);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.open.fec.gov/v1/candidates/totals/?office=S&cycle=2026&per_page=100&page=1&api_key=test-fec-key"
      );
    });

    it("returns empty map when no results", async () => {
      mockFetch.mockResolvedValueOnce(makeBulkPage([], 1, 1));

      const result = await fetchAllCandidateTotals("S", "2026", MOCK_API_KEY);

      expect(result.size).toBe(0);
    });

    it("skips results without candidate_id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ receipts: 100 }, { candidate_id: "S4VT00033", receipts: 200 }],
          pagination: { page: 1, pages: 1 },
        }),
      });

      const result = await fetchAllCandidateTotals("S", "2026", MOCK_API_KEY);

      expect(result.size).toBe(1);
      expect(result.has("S4VT00033")).toBe(true);
    });

    it("builds fecUri from candidate_id", async () => {
      mockFetch.mockResolvedValueOnce(
        makeBulkPage([{ candidate_id: "H8CA52109", receipts: 100 }], 1, 1)
      );

      const result = await fetchAllCandidateTotals("H", "2026", MOCK_API_KEY);

      expect(result.get("H8CA52109")?.fecUri).toBe("https://www.fec.gov/data/candidate/H8CA52109/");
    });

    it("throws on API error response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(fetchAllCandidateTotals("S", "2026", MOCK_API_KEY)).rejects.toThrow(
        "FEC API returned 500 for S page 1"
      );
    });

    it("throws on malformed response shape", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: "shape" }),
      });

      await expect(fetchAllCandidateTotals("S", "2026", MOCK_API_KEY)).rejects.toThrow(
        "Unexpected response shape for S page 1"
      );
    });

    it("throws on empty API key", async () => {
      await expect(fetchAllCandidateTotals("S", "2026", "")).rejects.toThrow(
        "FEC API key is required"
      );
    });

    it("throws on invalid cycle", async () => {
      await expect(fetchAllCandidateTotals("S", "24", MOCK_API_KEY)).rejects.toThrow(
        "Invalid cycle: 24"
      );
    });
  });

  describe("fetchCandidateCommittee", () => {
    it("returns principal committee ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ committee_id: "C00401224" }] }),
      });

      const result = await fetchCandidateCommittee("S4VT00033", "2026", MOCK_API_KEY);
      expect(result).toBe("C00401224");
    });

    it("calls correct URL with designation=P", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      await fetchCandidateCommittee("S4VT00033", "2026", MOCK_API_KEY);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/candidate/S4VT00033/committees/?designation=P&cycle=2026")
      );
    });

    it("returns null on empty results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchCandidateCommittee("S4VT00033", "2026", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("returns null on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await fetchCandidateCommittee("S4VT00033", "2026", MOCK_API_KEY);
      expect(result).toBeNull();
    });
  });

  describe("fetchPacContributions", () => {
    it("returns contribution items from Schedule A", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              contributor_id: "C00000935",
              contributor_name: "NATIONAL BEER WHOLESALERS",
              contribution_receipt_amount: 5000,
              contribution_receipt_date: "2025-06-15",
              memo_code: null,
            },
          ],
          pagination: { pages: 1, page: 1 },
        }),
      });

      const result = await fetchPacContributions("C00401224", "2026", MOCK_API_KEY);

      expect(result).toHaveLength(1);
      expect(result[0].contributorId).toBe("C00000935");
      expect(result[0].amount).toBe(5000);
    });

    it("returns empty array on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await fetchPacContributions("C00401224", "2026", MOCK_API_KEY);
      expect(result).toEqual([]);
    });

    it("throws on invalid committee ID", async () => {
      await expect(fetchPacContributions("invalid", "2026", MOCK_API_KEY)).rejects.toThrow(
        "Invalid committee ID: invalid"
      );
    });
  });

  describe("fetchIndependentExpenditures", () => {
    it("returns expenditure items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              committee_id: "C00578997",
              committee_name: "SENATE LEADERSHIP FUND",
              total: 1500000,
              support_oppose_indicator: "S",
              count: 25,
            },
          ],
        }),
      });

      const result = await fetchIndependentExpenditures("S4VT00033", "2026", MOCK_API_KEY);

      expect(result).toHaveLength(1);
      expect(result[0].committeeId).toBe("C00578997");
      expect(result[0].supportOppose).toBe("S");
    });

    it("returns empty array on error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await fetchIndependentExpenditures("S4VT00033", "2026", MOCK_API_KEY);
      expect(result).toEqual([]);
    });
  });

  describe("fetchCommitteeDetails", () => {
    it("returns committee metadata", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              committee_id: "C00401224",
              name: "BERNIE 2024",
              designation: "P",
              committee_type: "S",
              party: "DEM",
              treasurer_name: "John Smith",
              state: "VT",
            },
          ],
        }),
      });

      const result = await fetchCommitteeDetails("C00401224", MOCK_API_KEY);

      expect(result).toEqual({
        committeeId: "C00401224",
        name: "BERNIE 2024",
        designation: "P",
        committeeType: "S",
        party: "DEM",
        treasurerName: "John Smith",
        state: "VT",
      });
    });

    it("returns null on empty results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await fetchCommitteeDetails("C00401224", MOCK_API_KEY);
      expect(result).toBeNull();
    });

    it("throws on invalid committee ID", async () => {
      await expect(fetchCommitteeDetails("invalid", MOCK_API_KEY)).rejects.toThrow(
        "Invalid committee ID: invalid"
      );
    });
  });

  describe("createRateLimiter", () => {
    it("computes correct interval from requests per hour", async () => {
      vi.useFakeTimers();

      const throttle = createRateLimiter(3600);
      await throttle();
      const start = Date.now();
      const promise = throttle();
      vi.advanceTimersByTime(1000);
      await promise;
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(1000);

      vi.useRealTimers();
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
