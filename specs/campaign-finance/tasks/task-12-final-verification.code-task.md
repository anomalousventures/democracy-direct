---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Final Verification and Cleanup

## Description

Run the full CI check suite and verify all items from the campaign finance verification checklist. Ensure no regressions in existing tests.

## Background

Before merging, all lint, typecheck, and test suites must pass. The design doc contains a verification checklist that covers all functional requirements for the campaign finance feature.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (Verification section)

## Technical Requirements

1. Run `pnpm lint` - no errors
2. Run `pnpm format:check` - no formatting issues
3. Run `pnpm typecheck` - no type errors
4. Run `pnpm test` - all unit tests pass (including new campaign finance tests)
5. Run `pnpm test:integration` - all integration tests pass
6. Run `pnpm test:e2e` - all E2E tests pass
7. Verify all items in the design doc verification checklist
8. Ensure no regressions in existing tests (template tests, auth tests, etc.)

## Dependencies

- All previous campaign finance tasks (task-01 through task-11) must be complete

## Implementation Approach

1. Run the full CI check suite:
   - `pnpm lint && pnpm format:check && pnpm typecheck`
   - `pnpm test`
   - `pnpm test:integration` (with DATABASE_URL)
   - `pnpm test:e2e`
2. Walk through each item in the verification checklist from docs/tasks/campaign-finance.md:
   - [ ] FEC IDs stored in legislators table
   - [ ] Import script captures FEC IDs from congress-legislators
   - [ ] Campaign finance section displays on rep pages
   - [ ] Total receipts/disbursements show correctly
   - [ ] PAC vs individual breakdown shown
   - [ ] Cash on hand displayed
   - [ ] Attribution link present
   - [ ] Link to FEC source works
   - [ ] Data loads within acceptable time (<2s)
   - [ ] GitHub Action sync completes successfully
   - [ ] Handles legislators without FEC IDs gracefully
   - [ ] Handles multiple FEC IDs per legislator
   - [ ] Unit tests pass
   - [ ] E2E tests pass
3. Fix any issues found
4. Run the full suite again after any fixes

## Acceptance Criteria

1. **Lint passes**
   - Given all code changes
   - When `pnpm lint` runs
   - Then no errors are reported

2. **Formatting passes**
   - Given all code changes
   - When `pnpm format:check` runs
   - Then no formatting issues are reported

3. **Typecheck passes**
   - Given all code changes
   - When `pnpm typecheck` runs
   - Then no type errors are reported

4. **All unit tests pass**
   - Given the full test suite
   - When `pnpm test` runs
   - Then all tests pass (zero failures)

5. **Integration tests pass**
   - Given DATABASE_URL is configured
   - When `pnpm test:integration` runs
   - Then all integration tests pass

6. **E2E tests pass**
   - Given the site is built and served
   - When `pnpm test:e2e` runs
   - Then all E2E tests pass

7. **Verification checklist complete**
   - Given docs/tasks/campaign-finance.md
   - When all checklist items are reviewed
   - Then every item passes

8. **No regressions**
   - Given existing tests for other features
   - When the full suite runs
   - Then no previously passing tests fail

## Metadata

- **Complexity**: Low
- **Labels**: verification, qa, campaign-finance
- **Required Skills**: CI/CD, testing
