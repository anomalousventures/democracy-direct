# Legislation Search

## Status: Complete

All Epic 5 stories implemented. URLs migrated from `/bills` to `/legislation`, shared vote components extracted, vote and amendment detail pages created, "Your Reps Voted" banner and template CTAs added, navigation updated.

## Problem Statement

Currently, users can find their representative and view contact information. Once Voting Records is implemented, users will be able to see how their reps voted. But many users start with an issue - they want to know who voted for or against a specific bill, then contact those representatives. This "legislation-first" flow is essential for issue-based advocacy and civic organizing.

## Dependencies

- Voting Records integration (complete - provides vote data for both chambers)
- Bill Summaries integration (complete - provides bill metadata for search)

## What Was Built

### URL Migration (`/bills` → `/legislation`)

- Pages: `legislation.astro`, `legislation/[billId].astro`
- API routes: `api/legislation/search`, `api/legislation/[billId]`, `api/legislation/[billId]/votes`, `api/legislation/[billId]/amendments`
- Nav link updated to "Legislation" → `/legislation`
- `getBillPageUrl()` updated to return `/legislation/` paths

### Shareable URL Params

- `BillSearch` syncs state to URL: `?q=`, `?congress=`, `?type=`, `?status=`, `?subject=`
- `parseSearchParams()` / `serializeSearchParams()` as exported functions with tests

### Shared Vote Components (`src/components/vote/`)

- `PositionBadge` — colored badge for vote positions (yea/nay/not_voting/present)
- `VoteStatsBar` — horizontal bar chart of vote tallies
- `PartyBreakdown` — party-by-party vote grid (D/R/I)
- `MemberVoteList` — filterable member grid with position filter + search
- `YourRepsBanner` — shows user's reps' votes when district is saved
- Shared `VoteMember` type in `src/lib/types/vote.ts`

### Vote Detail Page (`/vote/[chamber]/[congress]/[session]/[rollCall]`)

- `src/pages/vote/[...path].astro` — server-rendered Astro page
- `src/components/VoteDetail.tsx` — React island with full breakdown
- Links back to parent bill when available
- Template CTAs when vote has associated bill

### Amendment Detail Page (`/legislation/amendment/[amendmentId]`)

- `src/pages/legislation/amendment/[amendmentId].astro` — server-rendered Astro page
- Shows amendment description, sponsor, latest action, and any roll call votes
- Links back to parent bill
- Amendment cards in bill detail page link to detail pages

### Your Reps Voted Banner

- `src/pages/api/user/representatives.ts` — GET endpoint (state + district params)
- `src/hooks/useMyReps.ts` — combines district detection + API call with session cache
- `YourRepsBanner` shown in VoteDetail and expanded BillVotes cards

### Template CTAs

- `src/components/BillTemplateCtas.astro` — "Browse templates" + "Write a template" buttons
- Added to bill detail page and vote detail page (when bill associated)

## URL Patterns

| URL                                   | Description                   |
| ------------------------------------- | ----------------------------- |
| `/legislation`                        | Browse/search all bills       |
| `/legislation?q=climate&congress=119` | Search with shareable params  |
| `/legislation/hr1234-119`             | Bill detail (H.R.1234, 119th) |
| `/vote/house/119/1/123`               | House vote #123, session 1    |
| `/vote/senate/119/2/45`               | Senate vote #45, session 2    |
| `/legislation/amendment/hamdt123-119` | House amendment #123          |
| `/legislation/amendment/samdt456-119` | Senate amendment #456         |

## Data Flow

```
/legislation (search/browse)
    ↓ click bill
/legislation/hr1234-119 (bill detail with tabs: Summary/Votes/Amendments)
    ↓ click "View full details" on a vote
/vote/house/119/1/123 (vote breakdown with your-reps banner)
    ↓ click rep or template CTA
/rep/A000001 or /templates?bill=hr1234-119

    ↓ click amendment in Amendments tab
/legislation/amendment/hamdt123-119 (amendment detail with votes)
```

## Verification

- [x] Users can search for bills by keyword
- [x] Users can filter by congress, bill type, status, subject
- [x] Search state preserved in URL params (shareable)
- [x] Bill detail page shows summary, status, sponsor, votes, amendments tabs
- [x] Vote detail page shows full breakdown with stats bar, party breakdown, member list
- [x] Amendment detail page shows description, sponsor, votes
- [x] Saved district users see "Your representatives voted" banner
- [x] "Browse templates" and "Write a template" CTAs on bill and vote pages
- [x] URLs are shareable and bookmarkable
- [x] Navigation says "Legislation" linking to `/legislation`
- [x] Unit tests pass (906 total)
