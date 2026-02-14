---
status: in-progress
created: 2026-02-11
started: 2026-02-13
completed: null
---

# Task: Update Legislator Import to Store FEC IDs

## Description

Modify the legislator import script to extract FEC candidate IDs from the congress-legislators YAML data and store them in the new `fecIds` column.

## Background

The congress-legislators data (from unitedstates/congress-legislators GitHub repo) includes FEC IDs under `raw.id.fec` as an array. Legislators may have multiple FEC IDs across different campaigns (e.g., Senate campaign ID and Presidential campaign ID). Currently the import script discards this data. The `fecIds` column was added to the legislators table in task-01.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (FEC ID Mapping section)

**Additional References:**

- Import script: src/scripts/import-legislators.ts
- Existing tests: src/scripts/import-legislators.test.ts

## Technical Requirements

1. Extract `id.fec` array from congress-legislators YAML data during import
2. Store FEC IDs as a text array in the `fecIds` column
3. Legislators without FEC IDs should have `null` (not an empty array)
4. Update existing unit tests to cover FEC ID extraction
5. Add test cases for legislators with single FEC ID, multiple FEC IDs, and no FEC IDs

## Dependencies

- task-01 (fecIds column exists in schema)

## Implementation Approach

1. Read `src/scripts/import-legislators.ts` to understand the current import flow and data mapping
2. Identify where legislator fields are mapped from raw YAML data to the upsert object
3. Add `fecIds` field mapping: extract `raw.id.fec` (check if it's an array or single value)
4. If `fec` field is missing or empty, set to `null`
5. If `fec` field exists, ensure it's stored as an array of strings
6. Update `src/scripts/import-legislators.test.ts`:
   - Add test fixture data with FEC IDs
   - Test legislator with single FEC ID
   - Test legislator with multiple FEC IDs (e.g., Senate + Presidential)
   - Test legislator with no FEC ID (null, not empty array)
7. Run `pnpm test -- src/scripts/import-legislators` to verify

## Acceptance Criteria

1. **FEC IDs extracted from YAML**
   - Given congress-legislators data with `id.fec` entries
   - When the import script processes a legislator
   - Then FEC IDs are extracted into the `fecIds` field

2. **Multiple FEC IDs stored correctly**
   - Given a legislator with multiple FEC IDs (e.g., `["S4VT00033", "P60007168"]`)
   - When their record is upserted
   - Then `fecIds` contains both IDs as a text array

3. **Missing FEC IDs handled**
   - Given a legislator without FEC ID data in the source
   - When their record is upserted
   - Then `fecIds` is `null` (not an empty array)

4. **Unit tests cover FEC ID scenarios**
   - Given the test suite for import-legislators
   - When tests run
   - Then there are passing tests for single FEC ID, multiple FEC IDs, and no FEC IDs

5. **Existing tests still pass**
   - Given the import script changes
   - When `pnpm test -- src/scripts/import-legislators` runs
   - Then all existing tests pass alongside the new FEC ID tests

## Metadata

- **Complexity**: Low
- **Labels**: data-import, campaign-finance, testing
- **Required Skills**: TypeScript, YAML parsing, Vitest
