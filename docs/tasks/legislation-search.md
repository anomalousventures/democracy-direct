# Legislation Search

## Status: Ready

## Problem Statement

Currently, users can find their representative and view contact information. Once Voting Records is implemented, users will be able to see how their reps voted. But many users start with an issue - they want to know who voted for or against a specific bill, then contact those representatives. This "legislation-first" flow is essential for issue-based advocacy and civic organizing.

## Dependencies

- Voting Records integration (must be complete first - provides vote data for both chambers)
- Bill Summaries integration (provides bill metadata for search)

## Research Completed

- [x] Design search UX: keyword search vs browse by topic vs both
  - **Both** - search bar + topic filters, similar to templates page
- [x] Determine how to display vote breakdowns
  - Party split bars (visual)
  - Two-column Yea/Nay lists with rep cards
  - Filter by state to narrow results
- [x] Design "contact reps who voted X" flow
  - Link to filtered templates: `/templates?bill=H.R.1234`
  - If user has saved district, highlight their reps' positions
- [x] URL structure for shareable results
  - `/legislation` - browse/search all
  - `/legislation?q=climate` - search results
  - `/legislation/hr1234` - bill detail (normalized URL)
  - `/vote/house/119/123` - specific vote detail

## Open Questions - Resolved

| Question              | Decision                                  | Rationale                     |
| --------------------- | ----------------------------------------- | ----------------------------- |
| Filter by state?      | **Yes**                                   | Essential for organizing      |
| Voice votes?          | **Show but note "no recorded positions"** | Transparency                  |
| Historical votes?     | **Current Congress only**                 | Matches data sync scope       |
| Multi-rep contact?    | **Link to filtered templates**            | Simpler than custom bulk flow |
| Template integration? | **Yes via Template Bill Linking**         | Separate task handles it      |

## Proposed Approach

1. Create legislation browse/search page with filters
2. Create bill detail page showing summary and vote info
3. Create vote detail page with Yea/Nay breakdown
4. Integrate saved district for "your reps voted..." indicator
5. Add CTAs linking to templates for the bill

## Implementation Tasks

1. Create `src/pages/legislation/index.astro` as the main browse/search page
2. Create `src/components/LegislationSearch.tsx` with search input and topic filter dropdowns
3. Create `src/db/queries/legislation.ts` with `searchBills(query, filters)` and `getBillsBySubject(subject)` queries
4. Add bill subjects to filter options (pulled from synced bill data)
5. Create `src/pages/legislation/[billId].astro` for bill detail page (e.g., `/legislation/hr1234`)
6. Create `src/lib/bill-utils.ts` with `normalizeBillNumber()` and `parseBillId()` helpers
7. Display bill summary, status, sponsor, and subjects on bill detail page
8. Create `src/components/VoteBreakdown.tsx` showing party split visualization (horizontal stacked bar)
9. Create `src/components/VoterList.tsx` showing Yea/Nay columns with rep cards (photo, name, party, state)
10. Add state filter dropdown to VoterList component
11. Create `src/pages/vote/[chamber]/[congress]/[rollCall].astro` for standalone vote detail page
12. Add "Your reps voted..." banner on vote pages when user has saved district (check localStorage or user record)
13. Add "See templates for this bill" button linking to `/templates?bill=X`
14. Add "Create a template for this bill" button linking to `/templates/new?bill=X`
15. Add legislation link to main navigation header
16. Add unit tests for bill search queries in `src/db/queries/legislation.test.ts`
17. Add unit tests for bill-utils helpers in `src/lib/bill-utils.test.ts`
18. Add e2e test in `tests/e2e/legislation-search.spec.ts` for search and filter flow
19. Add e2e test in `tests/e2e/vote-detail.spec.ts` for vote breakdown display

## URL Patterns

| URL                                | Description                       |
| ---------------------------------- | --------------------------------- |
| `/legislation`                     | Browse/search all bills           |
| `/legislation?q=climate`           | Search results                    |
| `/legislation?subject=Environment` | Filter by subject                 |
| `/legislation/hr1234`              | Bill detail (H.R.1234)            |
| `/legislation/s567`                | Bill detail (S.567)               |
| `/vote/house/119/123`              | House vote #123 in 119th Congress |
| `/vote/senate/119/45`              | Senate vote #45 in 119th Congress |

## Data Flow

```
/legislation (search/browse)
    ↓ click bill
/legislation/hr1234 (bill detail)
    ↓ click "see vote"
/vote/house/119/123 (vote breakdown)
    ↓ click rep or "contact" CTA
/rep/A000001 or /templates?bill=hr1234
```

## Verification

- [ ] Users can search for bills by keyword
- [ ] Users can browse/filter bills by subject
- [ ] Bill detail page shows summary, status, sponsor
- [ ] Vote detail page shows Yea/Nay breakdown
- [ ] Party split visualization displays correctly
- [ ] State filter narrows voter list
- [ ] Saved district users see "Your reps voted..." banner
- [ ] "See templates" and "Create template" CTAs work
- [ ] URLs are shareable and bookmarkable
- [ ] Navigation includes legislation link
- [ ] Mobile UX is usable
- [ ] Unit tests pass
- [ ] E2E tests pass
