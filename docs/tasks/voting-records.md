# Voting Records Integration

## Status: Ready

## Problem Statement

Understanding how representatives vote on legislation is essential for informed civic engagement. Currently, rep profile pages show contact information but no voting history. Users must leave the site to research voting records, creating friction in the contact process.

## Research Completed

- [x] Evaluate Congress.gov API for voting data availability and rate limits
  - **RECOMMENDED**: Official API, actively maintained
  - Rate limit: 5,000 requests/hour
  - Free API key from Data.gov (already in GitHub secrets as `CONGRESS_API_KEY`)
  - House Roll Call Votes beta endpoints available (added May 2025)
  - Covers current Congress (119th) and historical data
- [x] Evaluate ProPublica Congress API as alternative
  - **DEPRECATED**: No longer available, no new API keys issued
- [x] Evaluate GovTrack API for voting records
  - **DEPRECATED**: Bulk data/API ended ~2017, now redirects to official sources
- [x] Understand data structure: roll call votes, bill references, member positions
  - Congress.gov provides: roll call number, date, question, result, member positions (Yea/Nay/Not Voting/Present)
  - Links to associated bills when applicable
  - Party breakdown available
- [x] Research caching strategy
  - **Recommendation**: Cache in database, refresh daily via GitHub Action
  - Votes don't change after recorded, so aggressive caching is safe
- [x] Determine storage approach
  - **Recommendation**: Store in database for fast queries and reduce API calls
- [x] Review existing GitHub Actions
  - `.github/workflows/refresh-data.yml` already runs daily at 6am UTC
  - Already has `CONGRESS_API_KEY` secret configured
  - Pattern: add `pnpm sync:votes` step
- [x] Rate limit analysis
  - ~500-700 roll call votes per year (House + Senate combined)
  - Each vote = 1 API request for details + member positions
  - **Full sync ~700 requests** - well under 5,000/hour limit ✅

## Open Questions - Resolved

| Question                  | Decision                  | Rationale                                   |
| ------------------------- | ------------------------- | ------------------------------------------- |
| Which API?                | **Congress.gov API**      | Only active option, official source         |
| How far back?             | **Current Congress only** | Simpler, most relevant to users             |
| Categorize by topic?      | **Use bill subjects**     | Congress.gov provides subject tags on bills |
| Link to full bill?        | **Yes**                   | Congress.gov URLs are predictable           |
| Store vs fetch on-demand? | **Store in database**     | Better performance, less API dependency     |
| Sync mechanism?           | **GitHub Action cron**    | Already exists, simpler than worker         |
| Rate limiting concern?    | **Not an issue**          | ~700 requests total, limit is 5,000/hour    |

## Proposed Approach

1. Create database tables for votes and member positions
2. Build sync script that fetches votes from Congress.gov API
3. Add sync step to existing `refresh-data.yml` GitHub Action
4. Add votes section to rep profile page with filtering

## Implementation Tasks

1. Create `src/db/schema.ts` additions: `votes` table with rollCall, chamber, date, question, result, billNumber, billTitle
2. Create `src/db/schema.ts` additions: `memberVotes` table linking votes to legislators with position (yea/nay/not_voting/present)
3. Run database migration with `pnpm db:push`
4. Create `src/lib/congress-api.ts` with typed fetch wrapper for Congress.gov API
5. Create `src/scripts/sync-votes.ts` script that fetches recent votes and member positions from Congress.gov API
6. Add `"sync:votes": "tsx src/scripts/sync-votes.ts"` to package.json scripts
7. Add `pnpm sync:votes` step to `.github/workflows/refresh-data.yml` after legislators import
8. Create `src/db/queries/votes.ts` with `getVotesByMember(bioguideId, limit)` query
9. Create `src/components/VotingRecord.tsx` component that displays vote history with bill links
10. Add VotingRecord component to `src/pages/rep/[bioguideId].astro` as a tabbed section
11. Add filter controls for topic/category using bill subjects
12. Add pagination or "load more" for long vote histories
13. Add unit tests for Congress API wrapper in `src/lib/congress-api.test.ts`
14. Add unit tests for vote queries in `src/db/queries/votes.test.ts`
15. Add e2e test in `tests/e2e/voting-records.spec.ts` that verifies votes display on rep page

## Data Schema

```typescript
// votes table
{
  id: uuid,
  rollCall: number,
  chamber: 'house' | 'senate',
  congress: number,
  session: number,
  date: date,
  question: string,
  result: string,
  billNumber: string | null,
  billTitle: string | null,
  billSubjects: string[] | null,
  sourceUrl: string,
  createdAt: timestamp,
}

// memberVotes table
{
  voteId: uuid (FK),
  bioguideId: string (FK to legislators),
  position: 'yea' | 'nay' | 'not_voting' | 'present',
}
```

## API Endpoints Used

- `GET /v3/house-vote/{congress}/{rollCallNumber}` - House vote details
- `GET /v3/senate-vote/{congress}/{session}/{rollCallNumber}` - Senate vote details
- Member positions included in vote response

## Verification

- [ ] Voting history displays on rep profile pages
- [ ] Votes show correct position for each member
- [ ] Clicking vote links to bill on Congress.gov
- [ ] Filter by topic/category works
- [ ] Data loads within acceptable time (<2s)
- [ ] GitHub Action sync step runs successfully
- [ ] Handles missing data gracefully
- [ ] Unit tests pass for API wrapper
- [ ] Unit tests pass for database queries
- [ ] E2E tests pass for vote display
