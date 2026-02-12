---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Create DistrictTooltip Component and Rep Lookup API Endpoint

## Description

Create a tooltip component that shows district and representative information on the map, and an API endpoint that looks up a representative by state abbreviation and district number.

## Background

When a user clicks a district on the map, they need to see which representative serves that district. The TIGERweb data provides FIPS state code and district number, but rep information (name, party, bioguideId) comes from the local database. A lightweight API endpoint bridges this gap for the client-side map component. The tooltip shows the district name, rep info, and a link to navigate to the full rep profile page.

## Reference Documentation

**Required:**

- Design: docs/tasks/district-map.md (Implementation Tasks 11-13)

**Additional References:**

- TIGERweb wrapper (FIPS mapping): src/lib/tigerweb.ts
- Existing API route patterns: src/pages/api/
- API response utilities: src/lib/api-response.ts
- Existing legislator query patterns: src/db/queries/

## Technical Requirements

### API Endpoint: `src/pages/api/rep/by-district.ts`

1. Accept `state` (2-letter abbreviation) and `district` (number as string) as query parameters
2. Query the legislators table for a matching representative (chamber = "House" for district reps)
3. Return JSON with `bioguideId`, `fullName`, `party`, `state`, `district`
4. Return 404 via `notFound()` for unknown state/district combinations
5. Handle at-large districts (district = "00" or "0" maps to at-large/single district states)
6. Handle Senate lookup: if `chamber=senate` query param is provided, return senators for the state
7. Add `export const prerender = false`
8. Use Drizzle relational API for the query
9. Wrap database operations in try-catch

### DistrictTooltip: `src/components/DistrictTooltip.tsx`

1. Accept `DistrictInfo` from TIGERweb (state FIPS, district number, name, geoid)
2. Convert FIPS to state abbreviation using `fipsToState`
3. Fetch rep info from the API endpoint
4. Display: state name, district number/name, representative name and party
5. Include "View Representative" link to `/rep/{bioguideId}`
6. Handle at-large districts (display "At-Large" instead of district number)
7. Handle loading state while API call is in progress
8. Handle missing rep data gracefully (show "Representative data unavailable")

### Tests

9. Unit tests for the API endpoint
10. Unit tests for the DistrictTooltip component

## Dependencies

- task-01 (TIGERweb wrapper with FIPS mapping)
- task-02 (DistrictMap component that provides the click callback)

## Implementation Approach

1. Create `src/pages/api/rep/by-district.ts`:
   - Export GET handler
   - Parse `state` and `district` query params (validate non-empty)
   - Query `db.query.legislators.findFirst()` with `where: and(eq(state, state), eq(district, district))`
   - For at-large: district "00" should match legislators with district "0" or null
   - Return `jsonResponse({ bioguideId, fullName, party, state, district })`
   - Return `notFound()` if no match
2. Create API tests:
   - Test valid state + district returns rep data
   - Test unknown state + district returns 404
   - Test at-large district handling
   - Test missing parameters return badRequest
3. Create `src/components/DistrictTooltip.tsx`:
   - Props: `districtInfo: DistrictInfo`, `onClose?: () => void`
   - On mount or when districtInfo changes, fetch `/api/rep/by-district?state={abbr}&district={num}`
   - Display district info (state name, district)
   - Display rep info when loaded (name, party)
   - Show "View Representative" link
   - Handle loading, error, and missing-rep states
4. Create component tests:
   - Mock fetch to API endpoint
   - Test rendering with full data
   - Test at-large district display
   - Test loading state
   - Test missing rep data
5. Run all tests to verify

## Acceptance Criteria

1. **API returns rep data for valid district**
   - Given state "CA" and district "12"
   - When the API is called
   - Then it returns the representative's bioguideId, fullName, party

2. **API returns 404 for unknown district**
   - Given state "XX" and district "99"
   - When the API is called
   - Then a 404 response is returned

3. **API handles at-large districts**
   - Given a state with one at-large district (e.g., VT, district "00")
   - When the API is called
   - Then the at-large representative is returned

4. **API has prerender = false**
   - Given the API route file
   - When exports are reviewed
   - Then `export const prerender = false` is present

5. **Tooltip displays district info**
   - Given a DistrictInfo from TIGERweb
   - When the tooltip renders
   - Then state name and district number are displayed

6. **Tooltip shows rep info**
   - Given the API returns rep data
   - When the tooltip finishes loading
   - Then representative name and party are displayed

7. **Tooltip has View Representative link**
   - Given rep data is available
   - When the tooltip renders
   - Then a "View Representative" link to `/rep/{bioguideId}` is present

8. **Tooltip handles at-large**
   - Given a district with CD119FP "00"
   - When the tooltip renders
   - Then "At-Large" is displayed instead of a district number

9. **Tooltip handles missing rep**
   - Given the API returns 404
   - When the tooltip renders
   - Then "Representative data unavailable" (or similar) is shown

10. **All tests pass**
    - Given unit tests for API and component
    - When `pnpm test` runs
    - Then all tests pass

## Metadata

- **Complexity**: High
- **Labels**: api, ui, react, district-map, testing
- **Required Skills**: Astro API routes, React, TypeScript, Drizzle ORM, Vitest
