# Voting Records Integration

## Problem Statement

Understanding how representatives vote on legislation is essential for informed civic engagement. Currently, rep profile pages show contact information but no voting history. Users must leave the site to research voting records, creating friction in the contact process.

## Research Needed

- [ ] Evaluate Congress.gov API for voting data availability and rate limits
- [ ] Evaluate ProPublica Congress API as alternative (rate limits, data freshness)
- [ ] Evaluate GovTrack API for voting records
- [ ] Understand data structure: roll call votes, bill references, member positions
- [ ] Research caching strategy for vote data (how often to refresh)
- [ ] Determine storage approach (database vs API-on-demand)

## Open Questions

- Which API provides the best data quality and reliability?
- How far back should voting history go (current session only, or multiple)?
- How to categorize/filter votes by topic/issue?
- Should votes link to full bill information?
- How to handle missing or delayed vote data?
- Store votes in database or fetch on-demand with caching?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Data Points to Consider

- Bill name/number
- Vote date
- Member's position (Yea/Nay/Not Voting/Present)
- Bill category/topic
- Vote outcome (Passed/Failed)
- Link to full bill text

### UI Considerations

- Tabbed section on rep profile page
- Filter by issue/topic
- Sort by date (most recent first)
- Pagination or "load more" for long histories
- Visual indicators for vote position (green/red/gray)

## Verification

- [ ] Voting history displays on rep profile pages
- [ ] Votes show correct position for each member
- [ ] Filter by topic/category works
- [ ] Links to full bill information work
- [ ] Data loads within acceptable time (<2s)
- [ ] Handles API rate limits gracefully
- [ ] Displays appropriate message when no votes available
