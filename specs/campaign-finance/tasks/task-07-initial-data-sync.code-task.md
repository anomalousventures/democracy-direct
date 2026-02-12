---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Run Initial Data Sync on Dev Branch

## Description

Execute the campaign finance sync script against the dev database to populate initial data, then verify correctness by spot-checking known legislators.

## Background

The sync script, ProPublica wrapper, and database schema are all in place. This task runs the actual sync to populate the `campaignFinance` table on the dev branch. With ~535 legislators and 100ms throttle, the sync should take roughly 1 minute. Not all legislators will have ProPublica data (some may be too new or have incorrect FEC IDs).

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (Sync Strategy section)

## Technical Requirements

1. Run `pnpm sync:finance` against the dev database
2. Verify no script errors (exit code 0)
3. Check that 400+ legislators have finance records (of ~535 total)
4. Spot-check 3-5 known legislators against ProPublica directly:
   - Verify totalReceipts matches
   - Verify totalFromPACs and totalFromIndividuals match
   - Verify sourceUrl points to correct FEC page
5. Verify legislators without FEC IDs have no campaignFinance records

## Dependencies

- task-03 (migrations applied, FEC IDs backfilled)
- task-06 (sync script exists and passes tests)
- task-04 (API key configured)

## Implementation Approach

1. Ensure `.dev.vars` has both `DATABASE_URL` (dev branch) and `PROPUBLICA_CAMPAIGN_FINANCE_KEY`
2. Run `pnpm sync:finance`
3. Monitor output for errors or warnings
4. Query the dev database to count records: `SELECT COUNT(*) FROM campaign_finance`
5. Spot-check specific legislators:
   - Bernie Sanders (S000033) - well-known, should have data
   - Nancy Pelosi (P000197) - well-known, should have data
   - Mitch McConnell (M000355) - well-known, should have data
   - Compare amounts against the ProPublica API directly
6. Query for any legislators with fecIds but no campaignFinance record - investigate if any are unexpected

## Acceptance Criteria

1. **Sync completes successfully**
   - Given the sync script is run
   - When execution completes
   - Then exit code is 0 and no unhandled errors are logged

2. **Sufficient records populated**
   - Given the sync has completed
   - When campaignFinance records are counted
   - Then at least 400 records exist

3. **Data accuracy verified**
   - Given 3-5 known legislators are spot-checked
   - When their campaignFinance data is compared to ProPublica API
   - Then financial figures match (totalReceipts, totalFromPACs, totalFromIndividuals)

4. **Source URLs correct**
   - Given spot-checked legislators
   - When their sourceUrl field is inspected
   - Then it points to a valid FEC candidate page

5. **No spurious records**
   - Given legislators without fecIds
   - When the campaignFinance table is queried for their bioguideId
   - Then no records exist for them

## Metadata

- **Complexity**: Low
- **Labels**: data-sync, verification, campaign-finance
- **Required Skills**: Database querying, API verification
