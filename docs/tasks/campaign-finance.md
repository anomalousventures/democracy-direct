# Campaign Finance Data Integration

## Status: Ready

## Problem Statement

Understanding who funds representatives helps voters make informed decisions about their elected officials. Campaign finance data reveals potential conflicts of interest and influence patterns. Currently, users must visit external sites (FEC, OpenSecrets) to research this information.

## Research Completed

- [x] Evaluate FEC/OpenFEC API for contribution data
  - **Official source**, free API key from Data.gov
  - Rate limits enforced by API Umbrella (hourly, varies by key tier)
  - Data updated every 15 minutes for electronic filings, daily for summaries
  - Raw transaction-level data - requires aggregation work
  - Complex API with many endpoints
  - Good for detailed data but overkill for MVP
- [x] Evaluate OpenSecrets API for processed/aggregated data
  - ⚠️ **DEPRECATED** - API no longer maintained, new keys not being issued
  - Not recommended
- [x] Evaluate ProPublica Campaign Finance API
  - **RECOMMENDED for MVP** - pre-aggregated FEC data
  - Rate limit: 5,000 requests/day (generous)
  - Active and maintained (R package updated July 2025)
  - Simple REST API with JSON responses
  - Uses FEC candidate IDs for lookup
  - Endpoint: `https://api.propublica.org/campaign-finance/v1/`
  - API key via email to apihelp@propublica.org
- [x] Investigate FEC ID availability
  - **Key finding**: unitedstates/congress-legislators already includes FEC IDs
  - We import this data but don't store FEC IDs currently
  - Easy fix: add `fecIds` column to legislators table
- [x] Compare data freshness and accuracy
  - All sources derive from FEC ultimately
  - ProPublica updates in real-time on filing days
  - FEC API updates nightly
- [x] Review legal/terms of service
  - FEC data is public domain
  - ProPublica requires attribution

## API Comparison

| API         | Rate Limit | Data Type            | Recommendation     |
| ----------- | ---------- | -------------------- | ------------------ |
| OpenSecrets | 200/day    | Aggregated summaries | ⚠️ **DEPRECATED**  |
| ProPublica  | 5,000/day  | Processed FEC data   | ✅ **USE FOR MVP** |
| FEC/OpenFEC | Varies     | Raw transactions     | Future enhancement |

## Open Questions - Resolved

| Question                | Decision                                  | Rationale                               |
| ----------------------- | ----------------------------------------- | --------------------------------------- |
| Which API?              | **ProPublica Campaign Finance**           | Active, pre-aggregated, good rate limit |
| How to map legislators? | **Use FEC IDs from congress-legislators** | Already in our import data              |
| Time period?            | **Current cycle**                         | Most relevant to users                  |
| What to show?           | **Totals + PAC/individual breakdown**     | Clear, actionable info                  |
| Caching strategy?       | **Daily sync via GitHub Action**          | 535 legislators = well under 5,000/day  |
| Storage?                | **Database**                              | Fast queries, reduces API calls         |

## Proposed Approach

1. Add FEC IDs to legislators table (from congress-legislators data)
2. Request ProPublica Campaign Finance API key
3. Create database table for campaign finance summaries
4. Build sync script that fetches data using FEC IDs
5. Add campaign finance section to rep profile pages

## Implementation Tasks

### Database Updates

1. Add `fecIds` column (text array) to `legislators` table in `src/db/schema.ts`
2. Update `src/scripts/import-legislators.ts` to store FEC IDs from `raw.id.fec`
3. Create `src/db/schema.ts` additions: `campaignFinance` table
4. Run database migration with `pnpm db:push`

### API Integration

5. Request ProPublica API key by emailing apihelp@propublica.org
6. Add `PROPUBLICA_CAMPAIGN_FINANCE_KEY` to GitHub repository secrets
7. Create `src/lib/propublica-finance.ts` with typed fetch wrapper
8. Create `src/scripts/sync-campaign-finance.ts` script that:
   - Queries legislators with FEC IDs
   - Fetches candidate data from ProPublica for each FEC ID
   - Handles legislators with multiple FEC IDs (use most recent)
   - Upserts to campaignFinance table
9. Add `"sync:finance": "tsx src/scripts/sync-campaign-finance.ts"` to package.json
10. Add `pnpm sync:finance` step to `.github/workflows/refresh-data.yml`

### UI Components

11. Create `src/db/queries/campaign-finance.ts` with `getFinanceByMember(bioguideId)` query
12. Create `src/components/CampaignFinance.tsx` component displaying:
    - Total raised with cycle context
    - Total disbursements
    - Cash on hand
    - PAC vs individual contribution breakdown
13. Add CampaignFinance component to `src/pages/rep/[bioguideId].astro`
14. Add "Data from ProPublica/FEC" attribution link

### Testing

15. Add unit tests for ProPublica API wrapper in `src/lib/propublica-finance.test.ts`
16. Add unit tests for finance queries in `src/db/queries/campaign-finance.test.ts`
17. Add e2e test in `tests/e2e/campaign-finance.spec.ts`

## Sync Strategy

With 5,000 requests/day and 535 legislators:

- Each legislator needs 1 API call
- **Full sync daily is easily achievable** (535 << 5,000)
- Add 100ms throttle between requests to be respectful
- Track sync timestamp per legislator

## Data Schema

```typescript
// Add to legislators table
{
  fecIds: string[], // Array of FEC candidate IDs (may have multiple over career)
}

// campaignFinance table
{
  id: uuid,
  bioguideId: string (FK to legislators),
  fecId: string, // FEC candidate ID used for this record
  cycle: string, // e.g., "2024"
  totalReceipts: number,
  totalDisbursements: number,
  cashOnHand: number,
  totalFromPACs: number,
  totalFromIndividuals: number,
  debtsOwed: number | null,
  sourceUrl: string, // Link to FEC page
  lastUpdated: timestamp,
  createdAt: timestamp,
}
```

## ProPublica API Endpoints

### Get Candidate by FEC ID

```
GET /campaign-finance/v1/{cycle}/candidates/{fec-id}.json
X-API-Key: {api_key}
```

**Response includes:**

- `total_receipts` - Total amount raised
- `total_disbursements` - Total spent
- `cash_on_hand_end_period` - Current cash
- `total_from_pacs` - PAC contributions
- `total_from_individuals` - Individual contributions
- `debts_owed` - Outstanding debts
- `fec_uri` - Link to FEC page

### Search Candidates (backup)

```
GET /campaign-finance/v1/{cycle}/candidates/search.json?query={name}
```

## FEC ID Mapping

The congress-legislators YAML includes FEC IDs:

```yaml
- id:
    bioguide: S000033
    fec:
      - S4VT00033 # Senate campaign
      - P60007168 # Presidential campaign
```

**Note:** Legislators may have multiple FEC IDs (one per campaign). Use the most recent or relevant one based on current office.

## UI Considerations

- Display total raised prominently
- Show PAC vs individual as percentage bar or pie
- Cash on hand indicates campaign health
- Link to full FEC filing for transparency
- "Data from ProPublica / FEC.gov" attribution
- Handle missing data gracefully (show "Not available" for new candidates)

## Verification

- [ ] FEC IDs stored in legislators table
- [ ] Import script captures FEC IDs from congress-legislators
- [ ] Campaign finance section displays on rep pages
- [ ] Total receipts/disbursements show correctly
- [ ] PAC vs individual breakdown shown
- [ ] Cash on hand displayed
- [ ] Attribution link present
- [ ] Link to FEC source works
- [ ] Data loads within acceptable time (<2s)
- [ ] GitHub Action sync completes successfully
- [ ] Handles legislators without FEC IDs gracefully
- [ ] Handles multiple FEC IDs per legislator
- [ ] Unit tests pass
- [ ] E2E tests pass
