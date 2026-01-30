# Saved District Preference

## Status: In Progress

## Problem Statement

Users who have identified their congressional district through ZIP lookup or map selection shouldn't have to repeat this process every time they visit. Authenticated users should be able to save their district to their profile for a streamlined experience, with the ability to clear or change it if they move.

## Research Completed

- [x] Review current user schema for existing district fields
  - `savedZip` and `savedDistrict` already exist in users table
  - **Decision**: Only use `savedDistrict` + add `savedState` - do NOT save ZIP (privacy)
- [x] Determine if we need `savedState` or can derive from ZIP
  - **Need `savedState`** - can't derive without ZIP, and we're not storing ZIP
- [x] Review current session/auth flow for where to prompt saving
  - Middleware populates `locals.user` for logged-in users
  - `/zip/[zip].astro` is the ideal integration point - user just identified district
- [x] Consider UX for "Remember my district" opt-in
  - Checkbox on results page after successful lookup
  - Anonymous users get localStorage-based saving

## Open Questions - Resolved

| Question                | Decision                         | Rationale                                     |
| ----------------------- | -------------------------------- | --------------------------------------------- |
| Opt-in or automatic?    | **Opt-in checkbox**              | Respects user agency, clear consent           |
| Where to prompt?        | **After lookup on `/zip/[zip]`** | Natural moment, user just identified district |
| Anonymous localStorage? | **Yes**                          | Lightweight fallback, no backend needed       |
| Handle moves?           | **Profile page "Change" button** | Clears value, redirects to lookup             |
| Show indicator?         | **Yes, on homepage**             | "Viewing reps for CA-12 • Change" badge       |

## Proposed Approach

1. Add `savedState` column to users table
2. Create API endpoints to save/clear district preference
3. Add "Remember this district" checkbox to ZIP results page
4. Create new `/reps/[state]/[district]` route for direct navigation (avoids needing ZIP)
5. Add saved district banner to homepage with "View My Reps" button
6. Add localStorage fallback for anonymous users

## Implementation Tasks

1. Create database migration to add `savedState` varchar(2) column to users table
2. Run the migration on Neon with `pnpm db:push`
3. Update `src/db/schema.ts` to include the new `savedState` column
4. Create `src/pages/api/user/district.ts` with POST handler that saves state and district to authenticated user's record
5. Add DELETE handler to `src/pages/api/user/district.ts` that clears savedState and savedDistrict
6. Create `src/lib/saved-district.ts` with localStorage helpers: `getSavedDistrict()`, `setSavedDistrict(state, district)`, `clearSavedDistrict()`
7. Create `src/components/SaveDistrictPrompt.tsx` with checkbox that saves to API (logged in) or localStorage (anonymous)
8. Add SaveDistrictPrompt component to `/zip/[zip].astro` below the rep cards
9. Create `src/pages/reps/[state]/[district].astro` route that displays reps without needing a ZIP code
10. Create `src/components/SavedDistrictBanner.tsx` showing saved district with "View My Reps" and "Change" buttons
11. Add SavedDistrictBanner to `src/pages/index.astro` that checks user record (logged in) or localStorage (anonymous)
12. Add unit tests for the district API endpoints in `tests/api/user-district.test.ts`
13. Add unit tests for localStorage helpers in `src/lib/saved-district.test.ts`
14. Add e2e test for anonymous user save flow in `tests/e2e/saved-district-anonymous.spec.ts`
15. Add e2e test for authenticated user save flow in `tests/e2e/saved-district-authenticated.spec.ts`

## Privacy Considerations

- **Never save ZIP code** - too precise, identifies neighborhood
- State + district identifies ~750k people - acceptable granularity
- localStorage is device-local, never sent to server for anonymous users
- Opt-in only with clear explanation of what's stored
- Easy to clear at any time

## Verification

- [ ] Logged-in user can save their district after lookup
- [ ] Saved district persists across sessions (DB)
- [ ] User can clear saved district
- [ ] User with saved district sees banner on homepage
- [ ] "View My Reps" navigates to correct representatives
- [ ] Anonymous users can save to localStorage
- [ ] Anonymous saved district shows on homepage
- [ ] No ZIP codes stored anywhere
- [ ] Unit tests pass for API endpoints
- [ ] Unit tests pass for localStorage helpers
- [ ] E2E tests pass for anonymous save/clear flow
- [ ] E2E tests pass for authenticated save/clear flow
