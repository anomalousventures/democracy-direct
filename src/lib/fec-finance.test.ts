import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCandidateFinance, delay } from "./fec-finance";

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
