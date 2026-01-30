# Campaign Finance Data Integration

## Status: Research

> ⚠️ **API Status Update**: OpenSecrets API is deprecated and no longer issuing new API keys. This task needs revision to use FEC/OpenFEC API or ProPublica Campaign Finance API instead.

## Problem Statement

Understanding who funds representatives helps voters make informed decisions about their elected officials. Campaign finance data reveals potential conflicts of interest and influence patterns. Currently, users must visit external sites (FEC, OpenSecrets) to research this information.

## Research Completed

- [x] Evaluate FEC/OpenFEC API for contribution data
  - **Official source**, free API key from Data.gov
  - Rate limits enforced by API Umbrella (hourly, varies by key tier)
  - Data updated every 15 minutes for electronic filings, daily for summaries
  - Raw transaction-level data - requires aggregation work
  - Complex API with many endpoints
- [x] Evaluate OpenSecrets API for processed/aggregated data
  - ~~**RECOMMENDED for MVP** - pre-aggregated summaries~~
  - ⚠️ **DEPRECATED** - API no longer maintained, new keys not being issued
  - Rate limit: 200 calls/day (default)
  - Provides: top contributors, top industries, contribution totals
  - Data already categorized and processed
  - Creative Commons license (requires attribution)
  - **Status: Not recommended - use FEC or ProPublica instead**
- [x] Evaluate ProPublica Campaign Finance API
  - 5,000 requests/day
  - Active (unlike their Congress API)
  - Good middle ground between raw FEC and OpenSecrets
- [x] Compare data freshness and accuracy
  - All source from FEC ultimately
  - OpenSecrets adds value with industry categorization
  - FEC electronic filings: 15-minute updates
  - Summary data: daily updates
- [x] Review legal/terms of service
  - FEC data is public domain
  - OpenSecrets requires attribution under CC license

## API Comparison

| API         | Rate Limit | Data Type            | Recommendation       |
| ----------- | ---------- | -------------------- | -------------------- |
| OpenSecrets | 200/day    | Aggregated summaries | ⚠️ **DEPRECATED**    |
| ProPublica  | 5,000/day  | Processed FEC data   | **Consider for MVP** |
| FEC/OpenFEC | Varies     | Raw transactions     | Official source      |

## Open Questions - Resolved

| Question          | Decision                         | Rationale                       |
| ----------------- | -------------------------------- | ------------------------------- |
| Which API?        | **OpenSecrets**                  | Pre-aggregated, easy to display |
| Time period?      | **Current cycle + career**       | Both useful for context         |
| What to show?     | **Top industries + totals**      | Most actionable for voters      |
| Caching strategy? | **Daily sync via GitHub Action** | Stays under 200/day limit       |
| Storage?          | **Database**                     | Fast queries, reduces API calls |

## Proposed Approach

1. Get OpenSecrets API key and add to GitHub secrets
2. Create database table for campaign finance summaries
3. Build sync script that fetches data for all current legislators
4. Add campaign finance section to rep profile pages
5. Display with clear attribution per OpenSecrets license

## Implementation Tasks

1. Sign up for OpenSecrets API key at https://www.opensecrets.org/api/admin/index.php
2. Add `OPENSECRETS_API_KEY` to GitHub repository secrets
3. Create `src/db/schema.ts` additions: `campaignFinance` table with bioguideId, cid (OpenSecrets ID), cycle, totalRaised, totalFromPACs, totalFromIndividuals, topIndustries, topContributors, lastUpdated
4. Run database migration with `pnpm db:push`
5. Create mapping file `src/data/bioguide-to-cid.json` linking bioguide IDs to OpenSecrets CIDs
6. Create `src/lib/opensecrets-api.ts` with typed fetch wrapper for OpenSecrets API
7. Create `src/scripts/sync-campaign-finance.ts` script that fetches candSummary and candIndustry for each legislator
8. Add throttling to stay well under 200/day limit (sync ~180 legislators per run, all 535 over 3 days)
9. Add `"sync:finance": "tsx src/scripts/sync-campaign-finance.ts"` to package.json scripts
10. Add `pnpm sync:finance` step to `.github/workflows/refresh-data.yml`
11. Create `src/db/queries/campaign-finance.ts` with `getFinanceByMember(bioguideId)` query
12. Create `src/components/CampaignFinance.tsx` component displaying totals and top industries
13. Add CampaignFinance component to `src/pages/rep/[bioguideId].astro`
14. Add "Data from OpenSecrets.org" attribution link per license requirements
15. Add unit tests for OpenSecrets API wrapper in `src/lib/opensecrets-api.test.ts`
16. Add e2e test in `tests/e2e/campaign-finance.spec.ts` that verifies data displays on rep page

## Sync Strategy

With 200 calls/day limit and 535 legislators:

- Each legislator needs ~2 API calls (candSummary + candIndustry)
- Total: ~1,070 calls for full sync
- **Strategy**: Sync ~90 legislators per day (180 calls), full refresh every 6 days
- Track last synced in database, rotate through legislators

## Data Schema

```typescript
// campaignFinance table
{
  id: uuid,
  bioguideId: string (FK to legislators),
  opensecretsCid: string, // OpenSecrets candidate ID
  cycle: string, // e.g., "2024"
  totalRaised: number,
  totalSpent: number,
  cashOnHand: number,
  totalFromPACs: number,
  totalFromIndividuals: number,
  topIndustries: json, // [{name, total, pacs, indivs}]
  topContributors: json, // [{name, total, pacs, indivs}]
  lastUpdated: timestamp,
  createdAt: timestamp,
}
```

## API Endpoints Used

- `candSummary` - Total raised, spent, cash on hand by cycle
- `candIndustry` - Top 10 industries contributing
- `candContrib` - Top 10 contributors (optional, may skip for MVP)

## UI Considerations

- Total raised with cycle context
- Top 5 industries as bar chart or list
- PAC vs individual breakdown
- Link to full OpenSecrets profile
- Clear "Data from OpenSecrets.org" attribution

## Verification

- [ ] Campaign finance section displays on rep pages
- [ ] Total raised amount shows correctly
- [ ] Top industries display with amounts
- [ ] PAC vs individual breakdown shown
- [ ] Attribution link to OpenSecrets present
- [ ] Data loads within acceptable time (<2s)
- [ ] GitHub Action sync completes without rate limit errors
- [ ] Handles missing data gracefully (new candidates)
- [ ] Unit tests pass
- [ ] E2E tests pass
