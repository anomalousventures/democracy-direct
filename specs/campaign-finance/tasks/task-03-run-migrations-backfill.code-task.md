---
status: completed
created: 2026-02-11
started: 2026-02-13
completed: 2026-02-13
---

# Task: Run Migrations and Backfill FEC IDs

## Description

Apply the schema migrations (fecIds column + campaignFinance table) to the dev database branch, then run the updated import-legislators script to backfill FEC IDs for all existing legislators.

## Background

The dev branch (`br-winter-recipe-afwrwb8w`) in Neon project `floral-term-50641531` needs the new schema applied. After migration, the import script should be re-run to populate the `fecIds` column for existing legislators. The prod branch should NOT be modified without explicit confirmation.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md

## Technical Requirements

1. Apply migration to the dev database branch using `pnpm db:push` (dev) or `pnpm db:migrate`
2. Run the updated import-legislators script against the dev database to backfill FEC IDs
3. Verify FEC IDs populated for legislators that have them in the source data
4. Spot-check at least 3-5 legislators with known FEC IDs (e.g., Bernie Sanders: S4VT00033)
5. Verify the campaignFinance table is created and empty (ready for data)

## Dependencies

- task-01 (schema changes generated)
- task-02 (import script updated with FEC ID support)

## Implementation Approach

1. Ensure `.dev.vars` has `DATABASE_URL` pointing to the dev branch
2. Run `pnpm db:push` to apply schema changes to the dev branch
3. Verify migration applied by checking table structure via Drizzle Studio (`pnpm db:studio`) or Neon MCP tools
4. Run the import-legislators script: `pnpm import:legislators`
5. Query the dev database to verify FEC IDs:
   - Check a known legislator like Sanders (bioguide S000033, FEC S4VT00033)
   - Count how many legislators have non-null fecIds
   - Verify legislators without FEC IDs have null (not empty array)
6. Verify campaignFinance table exists and is empty

## Acceptance Criteria

1. **Migration applied to dev branch**
   - Given the dev database branch
   - When schema is inspected
   - Then the `fec_ids` column exists on the `legislators` table and the `campaign_finance` table exists

2. **FEC IDs populated**
   - Given the import script has run
   - When legislators with known FEC IDs are queried
   - Then their `fecIds` column contains the correct FEC ID array

3. **Sample verification passes**
   - Given at least 3 legislators with known FEC IDs (e.g., Sanders, Pelosi, McConnell)
   - When their records are queried
   - Then FEC IDs match the congress-legislators source data

4. **Null handling correct**
   - Given legislators without FEC IDs in the source
   - When their records are queried
   - Then `fecIds` is null (not an empty array)

5. **campaignFinance table ready**
   - Given the migration was applied
   - When the campaignFinance table is queried
   - Then it exists, has all expected columns, and is empty

## Metadata

- **Complexity**: Low
- **Labels**: database, migration, data-import, campaign-finance
- **Required Skills**: Drizzle ORM, Neon, database operations
