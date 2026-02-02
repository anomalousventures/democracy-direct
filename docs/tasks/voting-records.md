# Voting Records Integration

## Status: In Progress

**PR #1 (Shared Infrastructure)**: Merged (#50)
**PR #2 (Voting Records Data Layer)**: Submitted (#51) - schema, sync script, queries, GitHub Action complete

## Problem Statement

Understanding how representatives vote on legislation is essential for informed civic engagement. Currently, rep profile pages show contact information but no voting history. Users must leave the site to research voting records, creating friction in the contact process.

## Research Completed

- [x] Evaluate Congress.gov API for voting data availability and rate limits
  - **RECOMMENDED for House**: Official API, actively maintained
  - Rate limit: 5,000 requests/hour
  - Free API key from Data.gov (already in GitHub secrets as `CONGRESS_API_KEY`)
  - House Roll Call Votes endpoints available (added May 2025, now GA)
  - Senate voting endpoints do NOT exist in Congress.gov API
  - Covers current Congress (119th) and historical data
- [x] Evaluate Senate.gov XML for Senate votes
  - **RECOMMENDED for Senate**: Official source, direct XML access
  - No API key required, no documented rate limits
  - URL pattern: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{voteNumber}.xml`
  - Vote menu available: `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml`
  - Includes: vote number, date, question, result, individual member votes with party
- [x] Evaluate ProPublica Congress API as alternative
  - **DEPRECATED**: No longer available, no new API keys issued
- [x] Evaluate GovTrack API for voting records
  - **DEPRECATED**: Bulk data/API ended ~2017, now redirects to official sources
- [x] Evaluate unitedstates/congress scraper
  - Open source Python scrapers for both chambers
  - Outputs JSON/XML, but requires running scraper infrastructure
  - Good reference for data structures
- [x] Understand data structure: roll call votes, bill references, member positions
  - Both sources provide: roll call number, date, question, result, member positions (Yea/Nay/Not Voting/Present)
  - Links to associated bills when applicable
  - Party breakdown available
- [x] Research caching strategy
  - **Recommendation**: Cache in database, refresh daily via GitHub Action
  - Votes don't change after recorded, so aggressive caching is safe
- [x] Determine storage approach
  - **Recommendation**: Store in database for fast queries and reduce API/fetch calls
- [x] Review existing GitHub Actions
  - `.github/workflows/refresh-data.yml` already runs daily at 6am UTC
  - Already has `CONGRESS_API_KEY` secret configured
  - Pattern: add `pnpm sync:votes` step
- [x] Rate limit analysis
  - House: ~300-400 roll call votes per year, Congress.gov API limit 5,000/hour ✅
  - Senate: ~300-400 roll call votes per year, Senate.gov XML no documented limit ✅
  - **Full sync ~700 requests** - well within limits

## Data Sources

| Chamber | Source           | Format | Auth                 | Rate Limit      |
| ------- | ---------------- | ------ | -------------------- | --------------- |
| House   | Congress.gov API | JSON   | API key (configured) | 5,000/hour      |
| Senate  | Senate.gov       | XML    | None                 | None documented |

### Senate.gov XML URL Patterns

```
# List all votes in a session
https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_1.xml

# Individual vote details
https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00001.xml

# Pattern breakdown:
# vote_menu_{congress}_{session}.xml
# vote_{congress}_{session}_{voteNumber (5 digits, zero-padded)}.xml
```

## Open Questions - Resolved

| Question                  | Decision                              | Rationale                                   |
| ------------------------- | ------------------------------------- | ------------------------------------------- |
| Which API?                | **Hybrid: Congress.gov + Senate.gov** | Only way to get both chambers               |
| How far back?             | **Current Congress only**             | Simpler, most relevant to users             |
| Categorize by topic?      | **Use bill subjects**                 | Congress.gov provides subject tags on bills |
| Link to full bill?        | **Yes**                               | Congress.gov URLs are predictable           |
| Store vs fetch on-demand? | **Store in database**                 | Better performance, less API dependency     |
| Sync mechanism?           | **GitHub Action cron**                | Already exists, simpler than worker         |
| Rate limiting concern?    | **Not an issue**                      | ~700 requests total, well within limits     |

## Proposed Approach

1. Create database tables for votes and member positions
2. Build sync script with two data fetchers:
   - House: Congress.gov API (JSON)
   - Senate: Senate.gov XML (parse with fast-xml-parser or similar)
3. Add sync step to existing `refresh-data.yml` GitHub Action
4. Add votes section to rep profile page with filtering

## Implementation Tasks

### Database Schema

1. Create `src/db/schema.ts` additions: `votes` table with rollCall, chamber, congress, session, date, question, result, billNumber, billTitle, billSubjects, sourceUrl
2. Create `src/db/schema.ts` additions: `memberVotes` table linking votes to legislators with position (yea/nay/not_voting/present)
3. Run database migration with `pnpm db:push`

### Data Fetching

4. Create `src/lib/congress-api.ts` with typed fetch wrapper for Congress.gov API (House votes)
5. Create `src/lib/senate-votes.ts` with XML fetcher and parser for Senate.gov
   - Install XML parser: `pnpm add fast-xml-parser`
   - Fetch vote menu XML to get list of votes
   - Fetch individual vote XMLs for member positions
6. Create `src/scripts/sync-votes.ts` script that:
   - Fetches House votes from Congress.gov API
   - Fetches Senate votes from Senate.gov XML
   - Normalizes both to common schema
   - Upserts to database
7. Add `"sync:votes": "tsx src/scripts/sync-votes.ts"` to package.json scripts
8. Add `pnpm sync:votes` step to `.github/workflows/refresh-data.yml` after legislators import

### Queries & Components

9. Create `src/db/queries/votes.ts` with `getVotesByMember(bioguideId, limit)` query
10. Create `src/components/VotingRecord.tsx` component that displays vote history with bill links
11. Add VotingRecord component to `src/pages/rep/[bioguideId].astro` as a tabbed section
12. Add filter controls for chamber (House/Senate)
13. Add filter controls for topic/category using bill subjects
14. Add pagination or "load more" for long vote histories

### Testing

15. Add unit tests for Congress API wrapper in `src/lib/congress-api.test.ts`
16. Add unit tests for Senate XML parser in `src/lib/senate-votes.test.ts`
17. Add unit tests for vote queries in `src/db/queries/votes.test.ts`
18. Add e2e test in `tests/e2e/voting-records.spec.ts` that verifies votes display on rep page

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
  sourceUrl: string, // Congress.gov or Senate.gov URL
  createdAt: timestamp,
}

// memberVotes table
{
  voteId: uuid (FK),
  bioguideId: string (FK to legislators),
  position: 'yea' | 'nay' | 'not_voting' | 'present',
}
```

## API/Data Endpoints Used

### House (Congress.gov API)

- `GET /v3/house-vote/{congress}/{session}/{rollCallNumber}` - House vote details
- Member positions included in vote response

### Senate (Senate.gov XML)

- `GET /legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml` - Vote listing
- `GET /legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{rollCall}.xml` - Vote details
- XML includes `<members>` with `<member>` elements containing vote position

## Senate XML Structure (Reference)

```xml
<roll_call_vote>
  <congress>119</congress>
  <session>1</session>
  <vote_number>00001</vote_number>
  <vote_date>January 3, 2025</vote_date>
  <question>On the Motion</question>
  <result>Motion Agreed to</result>
  <vote_tally>
    <yeas>99</yeas>
    <nays>0</nays>
  </vote_tally>
  <members>
    <member>
      <member_full>Baldwin (D-WI)</member_full>
      <last_name>Baldwin</last_name>
      <party>D</party>
      <state>WI</state>
      <vote_cast>Yea</vote_cast>
      <lis_member_id>S354</lis_member_id>
    </member>
    <!-- ... more members ... -->
  </members>
</roll_call_vote>
```

## Verification

### Data Layer (Epic 2)

- [x] votes table created with proper indexes and unique constraint
- [x] memberVotes table created with composite primary key
- [x] lisId column added to legislators table for Senate vote mapping
- [x] sync:votes script syncs House votes from Congress.gov API
- [x] sync:votes script syncs Senate votes from Senate.gov XML
- [x] LIS ID mapping for Senate members works correctly
- [x] GitHub Action step added to refresh-data.yml
- [x] Discord notification updated for vote sync status
- [x] Vote database queries implemented (getVotesByMember, getVoteById, getVoteStats)
- [x] All lint/format/typecheck passes
- [x] All 704 unit tests pass

### UI Components (Epic 4 - Future)

- [ ] Voting history displays on rep profile pages for both chambers
- [ ] Votes show correct position for each member
- [ ] Clicking vote links to official source (Congress.gov or Senate.gov)
- [ ] Filter by chamber works
- [ ] Filter by topic/category works
- [ ] Data loads within acceptable time (<2s)
- [ ] E2E tests pass for vote display
