---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Create Campaign Finance Sync Script

## Description

Create a sync script that fetches campaign finance data from ProPublica for all legislators with FEC IDs and upserts the results to the database. Also add the corresponding npm script.

## Background

With 535 legislators and a 5,000 req/day rate limit, a full daily sync is easily achievable. The script queries legislators with non-null `fecIds`, fetches each one's finance data from ProPublica for the current election cycle, and upserts to the `campaignFinance` table. Legislators may have multiple FEC IDs; the most recent (last in array) should be used. A 100ms throttle between API calls prevents rate limiting issues.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (Sync Strategy section, Data Schema section)

**Additional References:**

- Existing sync script patterns: src/scripts/sync-votes.ts or similar
- ProPublica wrapper: src/lib/propublica-finance.ts (from task-05)

## Technical Requirements

1. Create `src/scripts/sync-campaign-finance.ts`
2. Query legislators with non-null `fecIds` from the database
3. For each legislator, use the last FEC ID in the array (most recent campaign)
4. Call `getCandidateByFecId` from the ProPublica wrapper for the current cycle
5. Upsert results to `campaignFinance` table (unique on bioguideId + cycle)
6. Add 100ms delay between API requests using the exported `delay` utility
7. Log progress: total legislators to process, current count, successes, failures
8. Exit with code 0 on success, non-zero on failure
9. Add `"sync:finance": "tsx src/scripts/sync-campaign-finance.ts"` to package.json scripts
10. Write comprehensive unit tests

## Dependencies

- task-03 (migrations applied, campaignFinance table exists)
- task-05 (ProPublica API wrapper exists)

## Implementation Approach

1. Create `src/scripts/sync-campaign-finance.ts`:
   - Read `DATABASE_URL` and `PROPUBLICA_CAMPAIGN_FINANCE_KEY` from environment
   - Fail fast if either is missing
   - Create DB connection, query legislators where `fecIds IS NOT NULL`
   - Determine current cycle (even year, e.g., "2026" or "2024")
   - For each legislator:
     - Pick last FEC ID from the array
     - Call `getCandidateByFecId` with the cycle
     - If data returned, upsert to campaignFinance table using `ON CONFLICT (bioguide_id, cycle) DO UPDATE`
     - If null returned, log a warning and continue
     - Wait 100ms before next request
   - Log summary: total processed, successful, failed, skipped
2. Add npm script to `package.json`
3. Create `src/scripts/sync-campaign-finance.test.ts`:
   - Mock database queries and ProPublica wrapper
   - Test sync of legislator with single FEC ID
   - Test sync of legislator with multiple FEC IDs (picks last)
   - Test skip of legislators without FEC IDs
   - Test handling when API returns null (logs warning, continues)
   - Test upsert behavior (update existing record for same bioguideId + cycle)
   - Test progress logging
4. Run `pnpm test -- src/scripts/sync-campaign-finance` to verify

## Acceptance Criteria

1. **Script queries legislators with FEC IDs**
   - Given the database has legislators with and without fecIds
   - When the script runs
   - Then only legislators with non-null fecIds are processed

2. **Most recent FEC ID used**
   - Given a legislator with fecIds `["S4VT00033", "P60007168"]`
   - When their data is fetched
   - Then `P60007168` (last in array) is used for the API call

3. **Data upserted correctly**
   - Given a successful ProPublica API response
   - When the data is saved
   - Then all financial fields are written to the campaignFinance table with correct bioguideId and cycle

4. **Upsert handles existing records**
   - Given a campaignFinance record already exists for a bioguideId + cycle
   - When the sync runs again
   - Then the existing record is updated (not duplicated)

5. **API failures handled gracefully**
   - Given ProPublica returns null for a legislator
   - When that legislator is processed
   - Then a warning is logged and the script continues to the next legislator

6. **100ms throttle between requests**
   - Given the sync is processing multiple legislators
   - When API calls are made
   - Then there is at least 100ms delay between consecutive calls

7. **Progress logging**
   - Given the script is running
   - When processing progresses
   - Then total, current count, successes, and failures are logged

8. **npm script works**
   - Given package.json is updated
   - When `pnpm sync:finance` is run
   - Then the sync script executes

9. **Unit tests pass**
   - Given the test suite
   - When `pnpm test -- src/scripts/sync-campaign-finance` runs
   - Then all tests pass

## Metadata

- **Complexity**: High
- **Labels**: data-sync, campaign-finance, api, testing
- **Required Skills**: TypeScript, Drizzle ORM, API integration, Vitest
