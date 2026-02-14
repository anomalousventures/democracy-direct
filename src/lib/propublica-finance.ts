const BASE_URL = "https://api.propublica.org/campaign-finance/v1";

const CYCLE_PATTERN = /^20\d{2}$/;
const FEC_ID_PATTERN = /^[A-Z]\d[A-Z]{2}\d{5}$/;

interface ProPublicaCandidate {
  id: string;
  name: string;
  party: string;
  fec_uri: string;
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand_end_period: number;
  total_from_pacs: number;
  total_from_individuals: number;
  debts_owed: number;
}

export interface ProPublicaCandidateResponse {
  status: string;
  results: ProPublicaCandidate[];
}

export interface CandidateFinanceData {
  totalReceipts: number;
  totalDisbursements: number;
  cashOnHand: number;
  totalFromPACs: number;
  totalFromIndividuals: number;
  debtsOwed: number;
  fecUri: string;
}

function hasResultsArray(data: unknown): data is { results: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  );
}

function isValidCandidate(data: unknown): data is ProPublicaCandidate {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.total_receipts === "number" &&
    typeof obj.total_disbursements === "number" &&
    typeof obj.cash_on_hand_end_period === "number" &&
    typeof obj.total_from_pacs === "number" &&
    typeof obj.total_from_individuals === "number" &&
    typeof obj.debts_owed === "number" &&
    typeof obj.fec_uri === "string"
  );
}

export async function getCandidateByFecId(
  apiKey: string,
  cycle: string,
  fecId: string
): Promise<CandidateFinanceData | null> {
  if (!apiKey) throw new Error("ProPublica API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
  if (!FEC_ID_PATTERN.test(fecId)) throw new Error(`Invalid FEC ID: ${fecId}`);

  const url = `${BASE_URL}/${cycle}/candidates/${fecId}.json`;

  try {
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey },
    });

    if (!response.ok) return null;

    const json: unknown = await response.json();
    if (!hasResultsArray(json)) return null;

    const candidate = json.results[0];
    if (!isValidCandidate(candidate)) return null;

    return {
      totalReceipts: candidate.total_receipts,
      totalDisbursements: candidate.total_disbursements,
      cashOnHand: candidate.cash_on_hand_end_period,
      totalFromPACs: candidate.total_from_pacs,
      totalFromIndividuals: candidate.total_from_individuals,
      debtsOwed: candidate.debts_owed,
      fecUri: candidate.fec_uri,
    };
  } catch {
    return null;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
