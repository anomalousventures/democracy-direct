# Data Refresh Optimization

## Status: Ready

## Problem Statement

The daily refresh-data workflow runs import scripts that perform unnecessary database operations:

1. **ZIP Districts**: Deletes all ~40,000 records and reinserts them every day, even though this data only changes after census redistricting (every ~10 years)
2. **Legislators**: Performs ~540 individual upsert queries regardless of whether any data changed

This creates unnecessary database ingress/egress costs and wear. We should optimize to only write changed data and notify the team of results via Discord.

## Research Completed

- [x] Investigate Census Bureau HTTP headers for last-modified date
  - **Finding**: Census file has `Last-Modified` header
  - Current value: `Thu, 24 Oct 2024 14:33:08 GMT`
  - Can use HTTP `If-Modified-Since` header to check if data changed
  - Also has `Content-Length: 6195997` for additional verification
- [x] Investigate congress-legislators GitHub repo for detecting changes
  - **Finding**: GitHub API returns commit history for specific files
  - `GET /repos/unitedstates/congress-legislators/commits?path=legislators-current.yaml&per_page=1`
  - Returns latest commit SHA and date
  - Can store last processed SHA and skip if unchanged
- [x] Evaluate hash-based change detection vs timestamp-based
  - **Recommendation**: Use HTTP headers for ZIP (simpler), commit SHA for legislators
  - Hash-based adds complexity without clear benefit since sources provide change indicators
- [x] Research Drizzle batch insert/upsert performance
  - **Finding**: Drizzle supports multi-row inserts via `.values([...])`
  - Neon supports `db.batch()` for multiple queries in one round-trip
  - Can batch 50-100 legislators per insert for ~10 queries instead of ~540
- [x] Determine if Neon has any bulk operation optimizations
  - **Finding**: Neon batch API reduces latency by combining queries
  - Batched statements run as implicit transaction
- [x] Estimate current vs optimized database operations per run
  - **Current**: ~40,000 deletes + ~40,000 inserts + ~540 upserts = ~80,540 operations
  - **Optimized (no changes)**: 2 HTTP requests + 2 DB reads = ~4 operations (99.99% reduction)
  - **Optimized (with changes)**: Same as current but only when needed

## Open Questions - Resolved

| Question                   | Decision                                               | Rationale                                         |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| Store hash of source data? | **No, use HTTP headers + commit SHA**                  | Sources already provide change detection          |
| Use If-Modified-Since?     | **Yes for Census**                                     | Simple, reliable, built-in HTTP caching           |
| Batch upserts?             | **Yes, 50 per batch**                                  | ~10 queries instead of ~540, good balance         |
| Handle transition?         | **Add dataSourceMeta table first**                     | Store last-modified/SHA before optimizing scripts |
| Discord metrics?           | **Source checked, changes detected, records affected** | Clear, actionable information                     |

## Proposed Approach

1. Create `dataSourceMeta` table to track source file state
2. Update ZIP import to check Census Last-Modified header first
3. Update legislators import to check GitHub commit SHA first
4. Batch legislators upserts (50 per query)
5. Add Discord notifications to refresh-data workflow
6. Track and report stats for each run

## Implementation Tasks

### Database Schema

1. Create `src/db/schema.ts` addition: `dataSourceMeta` table
2. Run database migration with `pnpm db:push`

### ZIP Districts Optimization

3. Update `src/scripts/import-zips.ts`:
   - Fetch headers with `HEAD` request first
   - Compare `Last-Modified` to stored value in dataSourceMeta
   - If unchanged: log "no changes" and return early
   - If changed: proceed with import, update dataSourceMeta after success
4. Add `--force` flag to bypass change detection when needed

### Legislators Optimization

5. Update `src/scripts/import-legislators.ts`:
   - Query GitHub API for latest commit SHA on `legislators-current.yaml`
   - Compare to stored SHA in dataSourceMeta
   - If unchanged: log "no changes" and return early
   - If changed: proceed with import
6. Convert individual upserts to batched inserts:
   - Group legislators into batches of 50
   - Use `db.insert().values([...]).onConflictDoUpdate()` for each batch
7. Add `--force` flag to bypass change detection when needed

### Script Output Format

8. Update both scripts to return JSON stats:
   ```json
   {
     "source": "census" | "github",
     "changed": true | false,
     "recordsProcessed": 540,
     "recordsAdded": 2,
     "recordsUpdated": 3,
     "recordsUnchanged": 535,
     "duration": "1.2s"
   }
   ```

### Discord Notifications

9. Reuse `DISCORD_WEBHOOK_URL` secret from smoke tests
10. Add notification step to `.github/workflows/refresh-data.yml`
11. Format success message:

    ```
    📊 Data Refresh Complete

    **ZIP Districts**: No changes (Last-Modified: Oct 24, 2024)
    **Legislators**: 3 updated, 537 unchanged (commit: 1a1d8d9)

    [View Run](link) | 2025-01-29 06:00 UTC
    ```

12. Format failure message with error details

### Workflow Updates

13. Capture script output in workflow
14. Parse JSON output for notification formatting
15. Add error handling for partial failures

## Data Schema

```typescript
// dataSourceMeta table
export const dataSourceMeta = pgTable("data_source_meta", {
  id: varchar("id", { length: 50 }).primaryKey(), // 'zip_districts', 'legislators'
  sourceUrl: varchar("source_url", { length: 500 }),
  lastModified: varchar("last_modified", { length: 100 }), // HTTP header or commit SHA
  contentLength: integer("content_length"), // for ZIP file
  lastChecked: timestamp("last_checked"),
  lastChanged: timestamp("last_changed"),
  recordCount: integer("record_count"),
});
```

## Change Detection Flow

### ZIP Districts

```
1. HEAD https://www2.census.gov/.../tab20_cd11920_zcta520_natl.txt
2. Compare Last-Modified header to dataSourceMeta.lastModified
3. If same → return { changed: false }
4. If different → download, process, import, update dataSourceMeta
```

### Legislators

```
1. GET https://api.github.com/repos/unitedstates/congress-legislators/commits?path=legislators-current.yaml&per_page=1
2. Compare commit SHA to dataSourceMeta.lastModified
3. If same → return { changed: false }
4. If different → download, process, import, update dataSourceMeta
```

## Batched Upsert Example

```typescript
// Current: 540 individual queries
for (const leg of transformed) {
  await db.insert(legislators).values(leg).onConflictDoUpdate({...});
}

// Optimized: ~11 batched queries
const BATCH_SIZE = 50;
for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
  const batch = transformed.slice(i, i + BATCH_SIZE);
  await db.insert(legislators).values(batch).onConflictDoUpdate({
    target: legislators.bioguideId,
    set: {
      firstName: sql`excluded.first_name`,
      lastName: sql`excluded.last_name`,
      // ... other fields
    },
  });
}
```

## HTTP Headers Example

```
GET /geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_natl.txt
Host: www2.census.gov

HTTP/2 200
last-modified: Thu, 24 Oct 2024 14:33:08 GMT
content-length: 6195997
```

## GitHub API Response Example

```json
[
  {
    "sha": "1a1d8d94296d10eb079541973b9cb7e730b12f77",
    "commit": {
      "committer": {
        "date": "2026-01-13T11:50:45Z"
      },
      "message": "Fix end date for expected special election date..."
    }
  }
]
```

## Discord Notification Format

### Success (with changes)

```
📊 Data Refresh Complete

**ZIP Districts**: No changes (cached since Oct 24, 2024)
**Legislators**: 3 updated, 537 unchanged
  └ Commit: 1a1d8d9 - "Fix end date for expected special election..."

Duration: 12.3s | [View Run](link)
```

### Success (no changes)

```
✅ Data Refresh - No Changes Detected

**ZIP Districts**: Unchanged (Last-Modified: Oct 24, 2024)
**Legislators**: Unchanged (SHA: 1a1d8d9)

Duration: 0.8s | [View Run](link)
```

### Failure

```
🚨 Data Refresh Failed

**Error**: Legislators import failed
**Details**: GitHub API rate limit exceeded

**ZIP Districts**: ✅ Completed (no changes)
**Legislators**: ❌ Failed

[View Run](link) | [Retry](link)
```

## Verification

- [ ] dataSourceMeta table created and migrated
- [ ] ZIP import checks Last-Modified header before downloading
- [ ] ZIP import skips when data unchanged
- [ ] ZIP import updates dataSourceMeta after successful import
- [ ] Legislators import checks GitHub commit SHA before downloading
- [ ] Legislators import skips when data unchanged
- [ ] Legislators import uses batched upserts (~11 queries instead of ~540)
- [ ] Both scripts support `--force` flag to bypass cache
- [ ] Scripts output JSON stats for workflow consumption
- [ ] Discord notification sent after each run
- [ ] Notification shows accurate stats
- [ ] Notification differentiates success/no-changes/failure
- [ ] Database operations reduced by >90% on typical runs
- [ ] Workflow handles partial failures gracefully
