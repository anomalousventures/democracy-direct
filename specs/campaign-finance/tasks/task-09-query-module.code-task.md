---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Create Campaign Finance Query Module

## Description

Create a database query module for fetching campaign finance data by legislator, using the Drizzle relational API. Includes unit tests and integration tests.

## Background

The project convention is to put query functions in `src/db/queries/` modules. Functions accept a `db` instance as the first parameter (no global caching - fresh connection per request). Return types are inferred from Drizzle's relational API and exported as type aliases. The relational API (`db.query.*`) MUST be used for fetching entities with related data. The campaign finance data should return the most recent cycle's record for a given legislator.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (Data Schema section)

**Additional References:**

- Existing query module patterns: src/db/queries/ (any existing file)
- Drizzle relational API: db.query.campaignFinance.findFirst/findMany with `with:` for relations
- CLAUDE.md: Drizzle Relational API (MANDATORY) section

## Technical Requirements

1. Create `src/db/queries/campaign-finance.ts`
2. Export `getFinanceByMember(db, bioguideId)` function:
   - Uses `db.query.campaignFinance.findFirst()`
   - Filters by `bioguideId`
   - Orders by `cycle` descending to get most recent
   - Returns the record or `null` if none exists
3. Export type alias: `type CampaignFinanceData = NonNullable<Awaited<ReturnType<typeof getFinanceByMember>>>`
4. Do NOT use manual joins - use relational API only
5. Write unit tests mocking the db
6. Write integration test against the real dev database

## Dependencies

- task-01 (campaignFinance table and relations defined)
- task-07 (data populated in dev database, needed for integration tests)

## Implementation Approach

1. Create `src/db/queries/campaign-finance.ts`:
   ```typescript
   export async function getFinanceByMember(db: Database, bioguideId: string) {
     return db.query.campaignFinance.findFirst({
       where: eq(campaignFinance.bioguideId, bioguideId),
       orderBy: desc(campaignFinance.cycle),
     });
   }
   ```
2. Export the inferred return type
3. Create `src/db/queries/campaign-finance.test.ts` (unit tests):
   - Mock `db.query.campaignFinance.findFirst`
   - Test returns data for legislator with finance record
   - Test returns null for legislator without finance record
   - Test that the query filters by bioguideId
   - Test that ordering is by cycle descending
4. Create `src/db/queries/campaign-finance.integration.test.ts`:
   - Requires `DATABASE_URL` environment variable (errors if missing, per project convention)
   - Creates real DB connection
   - Queries a known legislator with finance data
   - Verifies data shape matches the expected type
   - Queries a legislator without finance data and verifies null return
5. Run `pnpm test -- src/db/queries/campaign-finance` to verify unit tests
6. Run `pnpm test:integration` to verify integration tests (requires DATABASE_URL)

## Acceptance Criteria

1. **getFinanceByMember exported**
   - Given `src/db/queries/campaign-finance.ts`
   - When exports are reviewed
   - Then `getFinanceByMember` is exported with `(db, bioguideId)` signature

2. **Uses relational API**
   - Given the implementation
   - When the query code is reviewed
   - Then it uses `db.query.campaignFinance.findFirst()` (not `db.select().from()` with joins)

3. **Returns most recent cycle**
   - Given a legislator with data for cycles 2022 and 2024
   - When `getFinanceByMember` is called
   - Then the 2024 record is returned

4. **Returns null for missing data**
   - Given a legislator without any campaignFinance records
   - When `getFinanceByMember` is called
   - Then null is returned

5. **Type alias exported**
   - Given the module exports
   - When types are reviewed
   - Then `CampaignFinanceData` type alias is exported and inferred from the return type

6. **Unit tests pass**
   - Given `src/db/queries/campaign-finance.test.ts`
   - When `pnpm test -- src/db/queries/campaign-finance` runs
   - Then all unit tests pass

7. **Integration test passes**
   - Given `src/db/queries/campaign-finance.integration.test.ts`
   - When `pnpm test:integration` runs with DATABASE_URL
   - Then integration tests pass

8. **Integration test errors without DATABASE_URL**
   - Given no DATABASE_URL in environment
   - When the integration test attempts to run
   - Then it throws an error (not skip)

## Metadata

- **Complexity**: Medium
- **Labels**: database, queries, campaign-finance, testing
- **Required Skills**: Drizzle ORM, TypeScript, Vitest, integration testing
