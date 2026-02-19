---
status: completed
created: 2026-02-11
started: 2026-02-13
completed: 2026-02-13
---

# Task: Create ProPublica Campaign Finance API Wrapper

## Description

Create a typed TypeScript module wrapping the ProPublica Campaign Finance API with error handling, rate limiting, and comprehensive unit tests.

## Background

The ProPublica Campaign Finance API provides pre-aggregated FEC data at `https://api.propublica.org/campaign-finance/v1/`. The primary endpoint is getting a candidate by FEC ID for a given cycle. The API returns financial data including total receipts, disbursements, cash on hand, PAC contributions, individual contributions, debts, and a link to the FEC page. Rate limit is 5,000 requests/day. A 100ms throttle between requests is used to be respectful.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (ProPublica API Endpoints section, Data Schema section)

**Additional References:**

- Existing API wrapper patterns in the codebase (if any in src/lib/)

## Technical Requirements

1. Create `src/lib/propublica-finance.ts`
2. Export `getCandidateByFecId(apiKey: string, cycle: string, fecId: string)` function
3. Define TypeScript types for the API response:
   - `ProPublicaCandidateResponse` for the full API response envelope
   - `CandidateFinanceData` for the extracted financial fields (totalReceipts, totalDisbursements, cashOnHand, totalFromPACs, totalFromIndividuals, debtsOwed, fecUri)
4. Return `CandidateFinanceData | null` (null on HTTP errors like 404, 429, 500)
5. API key passed via `X-API-Key` header
6. Build correct URL: `https://api.propublica.org/campaign-finance/v1/{cycle}/candidates/{fec-id}.json`
7. Export a `delay(ms: number)` utility for throttling (used by caller, not built into the function)
8. Write comprehensive unit tests

## Dependencies

- task-04 (API key available for manual testing)

## Implementation Approach

1. Create `src/lib/propublica-finance.ts`:
   - Define response types matching ProPublica's JSON structure
   - Implement `getCandidateByFecId` that constructs the URL, makes the fetch, and parses the response
   - Map ProPublica's snake_case fields to camelCase TypeScript types
   - Return null for non-200 responses (don't throw)
   - Export the `delay` helper for callers to use between requests
2. Create `src/lib/propublica-finance.test.ts`:
   - Mock `globalThis.fetch` (no actual API calls in tests)
   - Test successful response parsing with realistic fixture data
   - Test mapping of all financial fields (totalReceipts, etc.)
   - Test 404 response returns null
   - Test 429 (rate limited) response returns null
   - Test 500 response returns null
   - Test network error returns null
   - Test correct URL construction with cycle and FEC ID
   - Test API key header is set correctly
3. Run `pnpm test -- src/lib/propublica-finance` to verify

## Acceptance Criteria

1. **Module exports getCandidateByFecId**
   - Given `src/lib/propublica-finance.ts` exists
   - When imports are reviewed
   - Then `getCandidateByFecId` is exported with correct signature

2. **Response types fully defined**
   - Given the TypeScript types in the module
   - When type definitions are reviewed
   - Then all financial fields from the design doc are represented (totalReceipts, totalDisbursements, cashOnHand, totalFromPACs, totalFromIndividuals, debtsOwed, fecUri)

3. **Successful response parsed correctly**
   - Given a mocked 200 response from ProPublica
   - When `getCandidateByFecId` is called
   - Then it returns a correctly typed `CandidateFinanceData` object with all fields mapped

4. **HTTP errors return null**
   - Given mocked 404, 429, or 500 responses
   - When `getCandidateByFecId` is called
   - Then it returns null without throwing

5. **Network errors return null**
   - Given a mocked fetch rejection (network error)
   - When `getCandidateByFecId` is called
   - Then it returns null without throwing

6. **URL constructed correctly**
   - Given cycle "2024" and FEC ID "S4VT00033"
   - When the fetch URL is inspected in tests
   - Then it equals `https://api.propublica.org/campaign-finance/v1/2024/candidates/S4VT00033.json`

7. **API key header set**
   - Given any API call
   - When fetch headers are inspected in tests
   - Then `X-API-Key` header contains the provided API key

8. **All tests pass**
   - Given the test suite
   - When `pnpm test -- src/lib/propublica-finance` runs
   - Then all tests pass

## Metadata

- **Complexity**: Medium
- **Labels**: api, campaign-finance, testing
- **Required Skills**: TypeScript, fetch API, Vitest, API integration
