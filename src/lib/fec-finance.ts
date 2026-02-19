const BASE_URL = "https://api.open.fec.gov/v1";
const PAGE_DELAY_MS = 500;

const CYCLE_PATTERN = /^20\d{2}$/;
const FEC_ID_PATTERN = /^[A-Z][A-Z0-9]{8}$/;

export type FecOffice = "H" | "S";

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
  candidate_id?: string;
  receipts: number | null;
  disbursements: number | null;
  // Single-candidate endpoint fields
  last_cash_on_hand_end_period?: number | null;
  individual_contributions?: number | null;
  last_debts_owed_by_committee?: number | null;
  // Bulk endpoint fields (different names, sometimes strings)
  cash_on_hand_end_period?: string | number | null;
  individual_itemized_contributions?: number | null;
  debts_owed_by_committee?: string | number | null;
  other_political_committee_contributions: number | null;
}

interface FecPaginatedResponse {
  results: unknown[];
  pagination: { pages: number; page: number };
}

function isPaginatedResponse(data: unknown): data is FecPaginatedResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results) &&
    "pagination" in data &&
    typeof (data as { pagination: unknown }).pagination === "object"
  );
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

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "string") return parseFloat(value) || 0;
  return value;
}

function toFinanceData(result: FecTotalsResult): CandidateFinanceData | null {
  const candidateId = result.candidate_id;
  if (!candidateId) return null;

  return {
    totalReceipts: result.receipts ?? 0,
    totalDisbursements: result.disbursements ?? 0,
    cashOnHand: toNumber(result.cash_on_hand_end_period ?? result.last_cash_on_hand_end_period),
    totalFromPACs: result.other_political_committee_contributions ?? 0,
    totalFromIndividuals:
      result.individual_itemized_contributions ?? result.individual_contributions ?? 0,
    debtsOwed: toNumber(result.debts_owed_by_committee ?? result.last_debts_owed_by_committee),
    fecUri: `https://www.fec.gov/data/candidate/${candidateId}/`,
  };
}

export async function fetchAllCandidateTotals(
  office: FecOffice,
  cycle: string,
  apiKey: string
): Promise<Map<string, CandidateFinanceData>> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);

  const results = new Map<string, CandidateFinanceData>();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${BASE_URL}/candidates/totals/?office=${office}&cycle=${cycle}&per_page=100&page=${page}&api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FEC API returned ${response.status} for ${office} page ${page}`);
    }

    const json: unknown = await response.json();
    if (!isPaginatedResponse(json)) {
      throw new Error(`Unexpected response shape for ${office} page ${page}`);
    }

    totalPages = json.pagination.pages;

    for (const item of json.results) {
      if (!isFecTotalsResult(item)) continue;
      const data = toFinanceData(item);
      if (data && item.candidate_id) {
        results.set(item.candidate_id, data);
      }
    }

    if (page < totalPages) {
      await delay(PAGE_DELAY_MS);
    }
    page++;
  }

  return results;
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

    if (!response.ok) {
      if (response.status === 404 || response.status === 429) return null;
      throw new Error(`FEC API returned ${response.status} for candidate ${fecId}`);
    }

    const json: unknown = await response.json();
    if (!hasResultsArray(json) || json.results.length === 0) return null;

    const result = json.results[0];
    if (!isFecTotalsResult(result)) return null;

    return {
      totalReceipts: result.receipts ?? 0,
      totalDisbursements: result.disbursements ?? 0,
      cashOnHand: toNumber(result.last_cash_on_hand_end_period ?? result.cash_on_hand_end_period),
      totalFromPACs: result.other_political_committee_contributions ?? 0,
      totalFromIndividuals:
        result.individual_contributions ?? result.individual_itemized_contributions ?? 0,
      debtsOwed: toNumber(result.last_debts_owed_by_committee ?? result.debts_owed_by_committee),
      fecUri: `https://www.fec.gov/data/candidate/${fecId}/`,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("FEC API returned")) throw error;
    return null;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CommitteeDetails {
  committeeId: string;
  name: string;
  designation: string | null;
  committeeType: string | null;
  party: string | null;
  treasurerName: string | null;
  state: string | null;
}

export interface PacContributionItem {
  contributorId: string;
  contributorName: string;
  amount: number;
  date: string;
  memoCode: string | null;
}

export interface IndependentExpenditureItem {
  committeeId: string;
  committeeName: string;
  total: number;
  supportOppose: string;
  count: number;
}

const COMMITTEE_ID_PATTERN = /^C\d{8}$/;

export async function fetchCandidateCommittee(
  fecId: string,
  cycle: string,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
  if (!FEC_ID_PATTERN.test(fecId)) throw new Error(`Invalid FEC ID: ${fecId}`);

  const url = `${BASE_URL}/candidate/${fecId}/committees/?designation=P&cycle=${cycle}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const json: unknown = await response.json();
    if (!hasResultsArray(json) || json.results.length === 0) return null;

    const committee = json.results[0] as { committee_id?: string };
    return committee.committee_id ?? null;
  } catch {
    return null;
  }
}

export async function fetchPacContributions(
  committeeId: string,
  cycle: string,
  apiKey: string
): Promise<PacContributionItem[]> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
  if (!COMMITTEE_ID_PATTERN.test(committeeId))
    throw new Error(`Invalid committee ID: ${committeeId}`);

  const items: PacContributionItem[] = [];
  let lastIndex: string | null = null;
  let lastContributionReceiptDate: string | null = null;

  for (;;) {
    let url = `${BASE_URL}/schedules/schedule_a/?committee_id=${committeeId}&contributor_type=committee&two_year_transaction_period=${cycle}&per_page=100&sort=-contribution_receipt_date&api_key=${apiKey}`;
    if (lastIndex && lastContributionReceiptDate) {
      url += `&last_index=${lastIndex}&last_contribution_receipt_date=${lastContributionReceiptDate}`;
    }

    const response = await fetch(url);
    if (!response.ok) break;

    const json: unknown = await response.json();
    if (!isPaginatedResponse(json)) break;

    for (const item of json.results) {
      const row = item as Record<string, unknown>;
      items.push({
        contributorId: (row.contributor_id as string) ?? "",
        contributorName: (row.contributor_name as string) ?? "",
        amount: toNumber(row.contribution_receipt_amount as number | string | null),
        date: (row.contribution_receipt_date as string) ?? "",
        memoCode: (row.memo_code as string) ?? null,
      });
    }

    if (json.results.length < 100) break;

    const lastResult = json.results[json.results.length - 1] as Record<string, unknown>;
    lastIndex = String(lastResult.sub_id ?? lastResult.idx ?? "");
    lastContributionReceiptDate = (lastResult.contribution_receipt_date as string) ?? null;

    if (!lastIndex) break;
    await delay(PAGE_DELAY_MS);
  }

  return items;
}

export async function fetchIndependentExpenditures(
  fecId: string,
  cycle: string,
  apiKey: string
): Promise<IndependentExpenditureItem[]> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!CYCLE_PATTERN.test(cycle)) throw new Error(`Invalid cycle: ${cycle}`);
  if (!FEC_ID_PATTERN.test(fecId)) throw new Error(`Invalid FEC ID: ${fecId}`);

  const url = `${BASE_URL}/schedules/schedule_e/by_candidate/?candidate_id=${fecId}&cycle=${cycle}&per_page=100&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const json: unknown = await response.json();
    if (!hasResultsArray(json)) return [];

    return json.results.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        committeeId: (row.committee_id as string) ?? "",
        committeeName: (row.committee_name as string) ?? "",
        total: toNumber(row.total as number | string | null),
        supportOppose: (row.support_oppose_indicator as string) ?? "",
        count: (row.count as number) ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchCommitteeDetails(
  committeeId: string,
  apiKey: string
): Promise<CommitteeDetails | null> {
  if (!apiKey) throw new Error("FEC API key is required");
  if (!COMMITTEE_ID_PATTERN.test(committeeId))
    throw new Error(`Invalid committee ID: ${committeeId}`);

  const url = `${BASE_URL}/committee/${committeeId}/?api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const json: unknown = await response.json();
    if (!hasResultsArray(json) || json.results.length === 0) return null;

    const row = json.results[0] as Record<string, unknown>;
    return {
      committeeId: (row.committee_id as string) ?? committeeId,
      name: (row.name as string) ?? "",
      designation: (row.designation as string) ?? null,
      committeeType: (row.committee_type as string) ?? null,
      party: (row.party as string) ?? null,
      treasurerName: (row.treasurer_name as string) ?? null,
      state: (row.state as string) ?? null,
    };
  } catch {
    return null;
  }
}

export function createRateLimiter(requestsPerHour: number) {
  const intervalMs = Math.ceil((3600 * 1000) / requestsPerHour);
  let lastRequest = 0;

  return async function throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastRequest;
    if (elapsed < intervalMs) {
      await delay(intervalMs - elapsed);
    }
    lastRequest = Date.now();
  };
}
