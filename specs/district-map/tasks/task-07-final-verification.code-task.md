---
status: completed
created: 2026-02-11
started: 2026-02-19
completed: 2026-02-19
---

# Task: Final Verification and Cleanup

## Description

Run the full CI check suite, verify bundle size impact, test mobile and keyboard accessibility, and confirm all items from the district map verification checklist.

## Background

The district map feature adds MapLibre GL JS (~220KB gzipped) which is a significant bundle size increase. This must be verified as acceptable and limited to the map page only. Mobile touch interactions and keyboard accessibility need manual verification since they're difficult to test in automated E2E.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Verification section)

## Technical Requirements

1. Run `pnpm lint` - no errors
2. Run `pnpm format:check` - no formatting issues
3. Run `pnpm typecheck` - no type errors
4. Run `pnpm test` - all unit tests pass
5. Run `pnpm test:e2e` - all E2E tests pass
6. Verify bundle size impact:
   - Run `pnpm build` and compare output sizes before and after
   - MapLibre should only be in the map page bundle (not other pages)
   - Total additional bundle size should be under 250KB gzipped
7. Test mobile touch interactions:
   - Pan and zoom work on touch devices
   - District click/tap triggers tooltip
   - Tooltip is readable on small screens
8. Test keyboard accessibility:
   - Tab navigation works on the map page
   - Map controls are keyboard accessible where possible
   - Focus doesn't get trapped in the map
9. Verify all items from the verification checklist in the design doc
10. Ensure no regressions in existing tests

## Dependencies

- All previous district map tasks (task-01 through task-06) must be complete

## Implementation Approach

1. Run the full CI suite:
   - `pnpm lint && pnpm format:check && pnpm typecheck`
   - `pnpm test`
   - `pnpm test:e2e`
2. Check bundle sizes:
   - Run `pnpm build` and note the output chunk sizes
   - Verify no MapLibre code appears in non-map page bundles
   - Compare total JS size to a build without the map feature
3. Manual mobile testing:
   - Open `/map` on a mobile device or Chrome DevTools mobile emulation
   - Test pinch-to-zoom and pan gestures
   - Test tapping a district to show tooltip
   - Verify tooltip layout on narrow screens
4. Manual keyboard testing:
   - Navigate to `/map` using keyboard only
   - Tab through page elements
   - Verify focus is not trapped in the map canvas
   - Verify skip-to-content or similar navigation works
5. Walk through the design doc verification checklist:
   - [ ] Map loads without blocking page render
   - [ ] District boundaries display correctly from TIGERweb
   - [ ] Click identifies correct district
   - [ ] Tooltip shows district name and rep info
   - [ ] "View Representative" link navigates correctly
   - [ ] Works on mobile (touch interaction)
   - [ ] Handles TIGERweb errors gracefully
   - [ ] Map is accessible (keyboard navigation)
   - [ ] Bundle size impact is acceptable (<250KB additional)
   - [ ] Performance is smooth on mid-range devices
   - [ ] Attribution for tile provider is displayed
   - [ ] Navigation includes map link
   - [ ] E2E tests pass

## Acceptance Criteria

1. **Lint passes**
   - Given all code changes
   - When `pnpm lint` runs
   - Then no errors are reported

2. **Formatting passes**
   - Given all code changes
   - When `pnpm format:check` runs
   - Then no formatting issues

3. **Typecheck passes**
   - Given all code changes
   - When `pnpm typecheck` runs
   - Then no type errors

4. **All tests pass**
   - Given unit and E2E test suites
   - When `pnpm test` and `pnpm test:e2e` run
   - Then all tests pass

5. **Bundle size acceptable**
   - Given a production build
   - When map page bundle is inspected
   - Then additional JS is under 250KB gzipped and MapLibre is not in other page bundles

6. **Mobile touch works**
   - Given a mobile device or emulator
   - When the map page is tested
   - Then pan, zoom, and tap interactions work correctly

7. **Keyboard accessible**
   - Given keyboard-only navigation
   - When the map page is navigated
   - Then focus is not trapped and page elements are reachable

8. **Verification checklist complete**
   - Given docs/tasks/district-map.md
   - When all checklist items are reviewed
   - Then every item passes

9. **No regressions**
   - Given existing tests for other features
   - When the full suite runs
   - Then no previously passing tests fail

## Metadata

- **Complexity**: Medium
- **Labels**: verification, qa, performance, accessibility, district-map
- **Required Skills**: Testing, mobile testing, accessibility, bundle analysis
