---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Integrate CampaignFinance on Rep Profile Page + E2E Test

## Description

Add the CampaignFinance component to the rep profile page, fetching data server-side in Astro frontmatter. Include attribution links and an E2E test verifying the full integration.

## Background

The rep profile page is at `src/pages/rep/[bioguideId].astro`. Data is fetched in the Astro frontmatter (server-side) and passed as props to React components. The CampaignFinance section should appear below existing rep info. Attribution to ProPublica/FEC is required by ProPublica's terms. The FEC source URL (stored in the `sourceUrl` field) should link directly to the candidate's FEC page.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (UI Components section, UI Considerations section)

**Additional References:**

- Rep profile page: src/pages/rep/[bioguideId].astro
- CampaignFinance component from task-10
- Query function from task-09

## Technical Requirements

1. Import `getFinanceByMember` in the rep page's frontmatter
2. Fetch campaign finance data server-side using the rep's bioguideId
3. Pass data as props to the `CampaignFinance` component
4. Add "Data from ProPublica / FEC.gov" attribution text below the section
5. Link the sourceUrl to the specific candidate's FEC page
6. Section should not render at all when no finance data exists (not even a heading)
7. Write E2E test covering the integration

## Dependencies

- task-09 (query module)
- task-10 (CampaignFinance component)

## Implementation Approach

1. In `src/pages/rep/[bioguideId].astro` frontmatter:
   - Import `getFinanceByMember` from `@/db/queries/campaign-finance`
   - Call `getFinanceByMember(db, bioguideId)` alongside existing data fetches
   - Store result as `financeData`
2. In the template section:
   - Conditionally render the CampaignFinance section only when `financeData` is not null
   - Pass `financeData` as props to the CampaignFinance component
   - Add attribution text with links:
     - "Data from [ProPublica](https://www.propublica.org/) / [FEC.gov](https://www.fec.gov/)"
     - If sourceUrl exists, link "View full FEC filing" to the sourceUrl
3. Create `tests/e2e/campaign-finance.spec.ts`:
   - Navigate to a rep profile page known to have finance data (e.g., `/rep/S000033`)
   - Verify campaign finance section is visible
   - Verify total raised amount is displayed (check for $ symbol and number)
   - Verify PAC/individual breakdown is present
   - Verify attribution link text is present
   - Verify FEC link is present and has correct href format
   - Navigate to a rep without finance data and verify section is absent
4. Run `pnpm test:e2e` to verify

## Acceptance Criteria

1. **Finance data fetched server-side**
   - Given the rep page frontmatter
   - When the page renders for a rep with finance data
   - Then finance data is fetched and available to the component

2. **CampaignFinance component renders**
   - Given a rep with campaign finance data
   - When their profile page is visited
   - Then the CampaignFinance section is visible with financial figures

3. **Section hidden when no data**
   - Given a rep without campaign finance data
   - When their profile page is visited
   - Then no campaign finance section renders (not even a heading)

4. **Attribution link present**
   - Given the finance section is rendered
   - When the page is inspected
   - Then "ProPublica" and "FEC" attribution text and links are visible

5. **FEC source URL linked**
   - Given a finance record with a sourceUrl
   - When the page is inspected
   - Then a link to the specific FEC candidate page exists

6. **E2E test passes - data present**
   - Given the E2E test navigates to a rep with finance data
   - When page elements are checked
   - Then total raised, breakdown, and attribution are all present

7. **E2E test passes - data absent**
   - Given the E2E test navigates to a rep without finance data
   - When page elements are checked
   - Then no campaign finance section exists

## Metadata

- **Complexity**: Medium
- **Labels**: ui, astro, campaign-finance, e2e, testing
- **Required Skills**: Astro, React, Playwright, server-side data fetching
