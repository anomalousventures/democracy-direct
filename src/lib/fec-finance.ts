const BASE_URL = "https://api.open.fec.gov/v1";

const CYCLE_PATTERN = /^20\d{2}$/;
const FEC_ID_PATTERN = /^[A-Z]\d[A-Z]{2}\d{5}$/;

export interface CandidateFinanceData {
  totalReceipts: number;
  totalDisbursements: number;
  cashOnHand: number;
  totalFromPACs: number;
  totalFromIndividuals: number;
  debtsOwed: number;
  fecUri: string;
}

interface FecTotalsResult {
  receipts: number | null;
  disbursements: number | null;
  last_cash_on_hand_end_period: number | null;
  other_political_committee_contributions: number | null;
  individual_contributions: number | null;
  last_debts_owed_by_committee: number | null;
}

function hasResultsArray(data: unknown): data is { results: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  );
}

function isFecTotalsResult(data: unknown): data is FecTotalsResult {
  return typeof data === "object" && data !== null;
}

export async function getCandidateFinance(
  fecId: string,
  cycle: string,
  apiKey: string
): Promise<CandidateFinanceData | null> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
  if (!FEC_ID_PATTERN.test(fecId)) throw new Error(`Invalid FEC ID: ${fecId}`);

  const url = `${BASE_URL}/candidate/${fecId}/totals/?cycle=${cycle}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) return null;

    const json: unknown = await response.json();
    if (!hasResultsArray(json) || json.results.length === 0) return null;

    const result = json.results[0];
    if (!isFecTotalsResult(result)) return null;

    return {
      totalReceipts: result.receipts ?? 0,
      totalDisbursements: result.disbursements ?? 0,
      cashOnHand: result.last_cash_on_hand_end_period ?? 0,
      totalFromPACs: result.other_political_committee_contributions ?? 0,
      totalFromIndividuals: result.individual_contributions ?? 0,
      debtsOwed: result.last_debts_owed_by_committee ?? 0,
      fecUri: `https://www.fec.gov/data/candidate/${fecId}/`,
    };
  } catch {
    return null;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
