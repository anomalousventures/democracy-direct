---
status: completed
created: 2026-02-11
started: 2026-02-13
completed: 2026-02-13
---

# Task: Add fecIds Column and Create campaignFinance Table

## Description

Add a `fecIds` text array column to the existing `legislators` table and create a new `campaignFinance` table to store ProPublica/FEC campaign finance data per legislator per election cycle.

## Background

The congress-legislators data source includes FEC candidate IDs (`raw.id.fec`) which we currently discard during import. Legislators may have multiple FEC IDs across campaigns (e.g., Senate vs Presidential). The `campaignFinance` table stores aggregated financial data synced from ProPublica's Campaign Finance API, keyed by bioguideId and election cycle.

The project follows specific Drizzle conventions: `uuid("id").primaryKey().defaultRandom()` for IDs, `timestamp("created_at").notNull().defaultNow()` for timestamps, and FK references using `.references(() => table.column, { onDelete: "..." })`. All relations must be defined in `src/db/relations.ts`. Type exports follow the `$inferSelect`/`$inferInsert` pattern.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (data schema section)

**Additional References:**

- Existing schema patterns: src/db/schema.ts
- Existing relations patterns: src/db/relations.ts

## Technical Requirements

1. Add `fecIds` column to `legislators` table as `text("fec_ids").array()` (nullable, not all legislators have FEC IDs)
2. Create `campaignFinance` table with columns matching the design doc schema:
   - `id`: uuid PK with defaultRandom
   - `bioguideId`: varchar FK to legislators.bioguideId with `onDelete: "cascade"`
   - `fecId`: varchar for the specific FEC ID used for this record
   - `cycle`: varchar for election cycle year (e.g., "2024")
   - `totalReceipts`: real for total amount raised
   - `totalDisbursements`: real for total spent
   - `cashOnHand`: real for cash on hand
   - `totalFromPACs`: real for PAC contributions
   - `totalFromIndividuals`: real for individual contributions
   - `debtsOwed`: real (nullable) for outstanding debts
   - `sourceUrl`: text for FEC page link
   - `lastUpdated`: timestamp for when data was last synced
   - `createdAt`: timestamp with defaultNow
3. Add unique constraint on `(bioguideId, cycle)` to prevent duplicates
4. Add index on `bioguideId` for efficient lookups
5. Add relations in `src/db/relations.ts`:
   - `campaignFinance` belongs to `legislators` (via bioguideId)
   - `legislators` has many `campaignFinance` records
6. Export `CampaignFinance`, `NewCampaignFinance` types using `$inferSelect`/`$inferInsert`
7. Generate migration with `pnpm db:generate`

## Dependencies

- None (this is the first task in the campaign finance feature)

## Implementation Approach

1. In `src/db/schema.ts`:
   - Add `fecIds: text("fec_ids").array()` to the `legislators` table definition
   - Create `campaignFinance` table following existing patterns (see `votes` table for a similar FK-to-legislators pattern)
   - Add unique constraint and index
   - Export type aliases at the bottom of the file
2. In `src/db/relations.ts`:
   - Import `campaignFinance` from `./schema`
   - Add `campaignFinance: many(campaignFinance)` to `legislatorsRelations`
   - Add new `campaignFinanceRelations` with `one(legislators, ...)` relation
3. Run `pnpm db:generate` to create migration files
4. Verify generated SQL looks correct

## Acceptance Criteria

1. **fecIds column added**
   - Given the legislators table in schema.ts
   - When the column definitions are reviewed
   - Then `fecIds` is defined as a nullable text array

2. **campaignFinance table defined**
   - Given src/db/schema.ts
   - When the campaignFinance table is reviewed
   - Then all columns from the design doc are present with correct Drizzle types

3. **FK constraint exists**
   - Given the campaignFinance table
   - When bioguideId column is inspected
   - Then it references legislators.bioguideId with onDelete cascade

4. **Unique constraint on bioguideId + cycle**
   - Given the campaignFinance table
   - When constraints are reviewed
   - Then a unique constraint exists on (bioguideId, cycle)

5. **Relations defined in relations.ts**
   - Given src/db/relations.ts
   - When relations are reviewed
   - Then campaignFinance has a `one` relation to legislators, and legislators has a `many` relation to campaignFinance

6. **Types exported**
   - Given src/db/schema.ts
   - When exports are reviewed
   - Then `CampaignFinance` and `NewCampaignFinance` types are exported

7. **Migration generated**
   - Given schema changes are complete
   - When `pnpm db:generate` runs
   - Then migration files are created without errors

8. **Typecheck passes**
   - Given all changes are saved
   - When `pnpm typecheck` runs
   - Then no type errors are reported

## Metadata

- **Complexity**: Medium
- **Labels**: database, schema, drizzle, campaign-finance
- **Required Skills**: Drizzle ORM, PostgreSQL, TypeScript
