# Bill Summaries Integration

## Status: In Progress

**PR #1 (Shared Infrastructure)**: Merged (#50) - types, utilities, API wrappers created
**PR #3 (Bill Summaries Data)**: Data layer complete - schema, sync scripts, queries, GitHub Actions

## Problem Statement

Understanding what legislation representatives sponsor and support is key to informed civic engagement. Currently, users must research bills separately on Congress.gov or other sites. Integrating bill summaries and sponsorship data would help users understand their representatives' priorities and craft more relevant letters.

## Research Completed

- [x] Evaluate Congress.gov API for bill data (summaries, sponsors, cosponsors)
  - **RECOMMENDED**: Official API, actively maintained
  - Rate limit: 5,000 requests/hour
  - Free API key (already in GitHub secrets as `CONGRESS_API_KEY`)
  - Provides: bill text, summaries (CRS), sponsors, cosponsors, subjects, status, actions
  - Coverage: Bills from 1973 onward, summaries from 1995
- [x] Evaluate GovTrack API for bill tracking
  - **DEPRECATED**: Bulk data/API ended, now uses official Congress.gov data
- [x] Evaluate ProPublica Congress API for bill data
  - **DEPRECATED**: No longer available, no new API keys issued
- [x] Understand data structures
  - Bills have: number, title, type (hr/s/hjres/sjres/hconres/sconres), status, subjects
  - Sponsors: single primary sponsor per bill
  - Cosponsors: can be many, with date added
  - Summaries: CRS-written, may not exist for all bills
- [x] Rate limit analysis ⚠️
  - ~10,000-15,000 bills per Congress
  - Full sync with summaries = 10,000-15,000 requests per Congress
  - **Need adaptive sync strategy to stay under 5,000/hour limit**

## Sync Strategy: Forward + Adaptive Backward

**Problem**: Full bill sync exceeds API limits

**Solution**: Two sync directions with adaptive scheduling

### Forward Sync (daily at 6am UTC)

- Fetches new/updated bills since last sync using `fromDateTime` parameter
- Keeps current data fresh
- Typically <100 bills per day - well within limits

### Backward Sync (adaptive frequency)

- Works backwards from oldest synced bill
- Processes ~2,000-3,000 bills per run (with 100ms throttle = ~3,000 req/hour)
- **Phase 1 (aggressive)**: Every 4 hours until 4-6 years of data collected
- **Phase 2 (maintenance)**: Once daily, eventually no-op when fully backfilled
- Script checks coverage and self-adjusts (or we manually update cron after milestone)

### Coverage Target

- Priority: Current Congress (119th) + previous 2 Congresses (117th, 118th)
- ~3 Congresses × ~12,000 bills = ~36,000 bills
- At 3,000/run, 6 runs/day = ~18,000/day
- **Full backfill in ~2-3 days** with aggressive schedule

### Throttling

- 100ms delay between requests
- ~3,000 requests/hour max = safe margin under 5,000 limit

### Scope

- Only sponsored bills (not cosponsored) - reduces volume significantly
- Cosponsorship data fetched on-demand when viewing rep page

## Open Questions - Resolved

| Question                  | Decision                         | Rationale                                  |
| ------------------------- | -------------------------------- | ------------------------------------------ |
| Which API?                | **Congress.gov API**             | Only active option, official source        |
| Sponsored vs cosponsored? | **Sponsored only for sync**      | Cosponsored on-demand to avoid rate limits |
| How to categorize?        | **Use bill subjects from API**   | Official subject taxonomy                  |
| Link to full text?        | **Yes**                          | Congress.gov URLs are predictable          |
| Handle missing summaries? | **Show "Summary not available"** | Not all bills have CRS summaries           |
| Backfill frequency?       | **Aggressive then taper**        | Fast initial data, then maintenance mode   |

## Proposed Approach

1. Create database tables for bills with sync cursor tracking
2. Build sync script with `--direction forward|backward` flag
3. Add forward sync to existing refresh-data workflow (daily)
4. Add backward sync workflow with aggressive initial schedule (every 4 hours)
5. After ~1 week, reduce backward sync to daily, then disable once complete
6. Add bills section to rep profile page

## Implementation Tasks

### Data Layer (Epic 3 - Complete)

1. [x] Create `src/db/schema.ts` additions: `bills` table with billNumber, billType, congress, title, summary, status, subjects, introducedDate, latestActionDate, sponsorBioguideId
2. [x] Create `src/db/schema.ts` additions: `syncCursors` table to track forward/backward sync positions and coverage stats
3. [x] Run database migration with `pnpm db:generate` and `pnpm db:migrate`
4. [x] Add Congress.gov bill endpoints to `src/lib/congress-api.ts` (already exists from Epic 1)
5. [x] Create `src/scripts/sync-bills.ts` script that accepts `--direction forward` or `--direction backward` flag
6. [x] Implement forward sync: use `fromDateTime` param with last sync timestamp
7. [x] Implement backward sync: fetch bills older than oldest synced bill, process in batches of ~3,000
8. [x] Add coverage check: script logs how many Congresses are fully synced
9. [x] Add 100ms throttle delay between API requests in sync script
10. [x] Add `"sync:bills": "tsx src/scripts/sync-bills.ts"` to package.json scripts
11. [x] Add `pnpm sync:bills --direction forward` step to `.github/workflows/refresh-data.yml`
12. [x] Create `.github/workflows/backfill-bills.yml` with initial cron `0 */4 * * *` (every 4 hours)
13. [x] Create `src/db/queries/bills.ts` with `getBillsByMember(bioguideId, limit)` query
14. [x] Add unit tests for bill sync logic in `src/scripts/sync-bills.test.ts`
15. [x] Add unit tests for bill queries in `src/db/queries/bills.test.ts`

### UI Components (Epic 4 - Pending)

14. [ ] Create `src/components/SponsoredBills.tsx` component that displays bill list with status indicators
15. [ ] Add SponsoredBills component to `src/pages/rep/[bioguideId].astro` as a tabbed section
16. [ ] Add filter controls for bill status (introduced, passed committee, passed chamber, signed)
17. [ ] Add filter controls for topic/subject
18. [ ] Add e2e test in `tests/e2e/sponsored-bills.spec.ts` that verifies bills display on rep page

### Maintenance

21. [ ] After backfill complete (~1 week): update backfill-bills.yml cron to daily or disable

### SEO: Sitemap Integration

22. Create bill detail page at `/bills/[congress]/[type]/[number]` (e.g., `/bills/119/hr/1234`)
23. Add Drizzle query `getCurrentCongressBillsForSitemap()` to `src/db/queries/sitemap.ts`
    - Select billType, billNumber, congress, latestActionDate for current Congress (119th)
    - Returns data needed to generate `/bills/119/hr/1234` style URLs
24. Update sitemap generation to include bill pages (uses DATABASE_URL at build time)
25. Include `<lastmod>` based on latestActionDate for each bill

## Data Schema

```typescript
// bills table
{
  id: uuid,
  billNumber: string, // e.g., "H.R.1234"
  billType: string, // hr, s, hjres, sjres, hconres, sconres
  congress: number,
  title: string,
  summary: string | null, // CRS summary, may not exist
  status: string, // introduced, passed_house, passed_senate, signed, etc.
  subjects: string[], // policy area tags
  introducedDate: date,
  latestActionDate: date,
  latestActionText: string,
  sponsorBioguideId: string (FK to legislators),
  congressGovUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp,
}

// syncCursors table
{
  id: string, // 'bills_forward' or 'bills_backward'
  cursor: string, // ISO timestamp or oldest bill date depending on direction
  oldestCongress: number | null, // track how far back we've gone
  updatedAt: timestamp,
}
```

## API Endpoints Used

- `GET /v3/bill` - List bills (supports `fromDateTime` for incremental)
- `GET /v3/bill/{congress}/{type}/{number}` - Bill details
- `GET /v3/bill/{congress}/{type}/{number}/summaries` - CRS summaries
- `GET /v3/member/{bioguideId}/sponsored-legislation` - Bills by sponsor

## Verification

- [ ] Sponsored bills display on rep profile pages
- [ ] Bills show correct status indicators
- [ ] Summaries display when available
- [ ] Clicking bill links to Congress.gov
- [ ] Filter by status works
- [ ] Filter by topic/subject works
- [ ] Data loads within acceptable time (<2s)
- [ ] Forward sync GitHub Action completes without rate limit errors
- [ ] Backward sync GitHub Action completes without rate limit errors
- [ ] Forward sync only fetches new/updated bills
- [ ] Backward sync gradually backfills historical data
- [ ] Coverage reaches 3+ Congresses within first week
- [ ] Backward sync cron reduced after backfill complete
- [ ] Handles bills without summaries gracefully
- [ ] Bill detail pages render correctly
- [ ] Current Congress bills appear in sitemap
- [ ] Sitemap includes correct lastmod dates for bills
- [ ] Unit tests pass
- [ ] E2E tests pass
