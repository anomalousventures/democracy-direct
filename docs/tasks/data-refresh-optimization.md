# Data Refresh Optimization

## Status: Research

## Problem Statement

The daily refresh-data workflow runs import scripts that perform unnecessary database operations:

1. **ZIP Districts**: Deletes all ~40,000 records and reinserts them every day, even though this data only changes after census redistricting (every ~10 years)
2. **Legislators**: Performs ~540 individual upsert queries regardless of whether any data changed

This creates unnecessary database ingress/egress costs and wear. We should optimize to only write changed data and notify the team of results via Discord.

## Research Needed

- [ ] Investigate Census Bureau HTTP headers for last-modified date
- [ ] Investigate congress-legislators GitHub repo for detecting changes (commits, last-modified)
- [ ] Evaluate hash-based change detection vs timestamp-based
- [ ] Research Drizzle batch insert/upsert performance
- [ ] Determine if Neon has any bulk operation optimizations
- [ ] Estimate current vs optimized database operations per run

## Open Questions

- Should we store a hash of the source data to detect changes?
- Should we use HTTP If-Modified-Since headers to skip unchanged sources?
- Should legislators use batch upserts instead of individual queries?
- How to handle the transition period when adding change detection?
- What metrics should Discord notifications include?

## Proposed Approach

_To be filled after research._

### ZIP Districts Optimization Ideas

1. **Hash-based skip**: Compute SHA-256 of processed data, store in syncCursors table, skip import if hash matches
2. **HTTP caching**: Use Census Bureau's Last-Modified header, skip if unchanged
3. **Differential updates**: Compare counts first, only full refresh if mismatch

### Legislators Optimization Ideas

1. **Batch upserts**: Use multi-row INSERT ... ON CONFLICT instead of individual queries
2. **Hash per legislator**: Store hash of each record, only update changed records
3. **Source change detection**: Check GitHub API for commits to legislators-current.yaml

### Discord Notifications

Report results of each refresh run:

- Data source checked (Census, GitHub)
- Whether changes were detected
- Number of records added/updated/unchanged
- Any errors encountered
- Link to GitHub Action run

## Implementation Tasks

_To be filled after research._

### Change Detection

- [ ] Add `dataHash` column to syncCursors table (or create new `dataSourceStatus` table)
- [ ] Implement hash computation for ZIP district data
- [ ] Implement hash computation for legislators data
- [ ] Add early exit when hash matches (no changes detected)

### ZIP Districts Script

- [ ] Fetch Census data
- [ ] Compute hash of processed data
- [ ] Compare to stored hash
- [ ] If match: log "no changes" and exit
- [ ] If different: perform full refresh (current behavior) and update stored hash

### Legislators Script

- [ ] Batch upserts (e.g., 50 at a time) instead of individual queries
- [ ] Optionally: per-record hash to only update changed legislators
- [ ] Return stats: added, updated, unchanged counts

### Discord Notifications

- [ ] Create Discord webhook in server settings
- [ ] Store webhook URL as `DISCORD_WEBHOOK_URL` GitHub secret
- [ ] Add Discord notification step to refresh-data.yml
- [ ] Format message with run results:

  ```
  📊 Data Refresh Complete

  **ZIP Districts**: No changes (hash matched)
  **Legislators**: 3 updated, 537 unchanged

  [View Run](link) | 2024-01-29 06:00 UTC
  ```

- [ ] Send notification on failure with error details

### Workflow Updates

- [ ] Modify refresh-data.yml to capture script output
- [ ] Pass results to Discord notification step
- [ ] Add error handling for partial failures

## Data Schema Additions

```typescript
// Option A: Extend syncCursors table
{
  id: string, // 'zip_districts', 'legislators'
  dataHash: string | null, // SHA-256 of processed data
  lastChecked: timestamp,
  lastChanged: timestamp | null,
  recordCount: number,
}

// Option B: New dataSourceStatus table
{
  id: string, // 'census_zcta_cd', 'github_legislators'
  sourceUrl: string,
  dataHash: string,
  lastChecked: timestamp,
  lastModified: timestamp | null, // from HTTP header
  recordCount: number,
}
```

## Verification

- [ ] ZIP import skips when data unchanged (hash match)
- [ ] ZIP import runs full refresh when data changed
- [ ] Legislators import uses batch queries
- [ ] Discord notification sent after each run
- [ ] Notification shows accurate stats
- [ ] Notification includes link to GitHub Action
- [ ] Failures trigger error notification
- [ ] Database operations reduced by >90% on typical runs
