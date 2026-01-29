# Bill Summaries Integration

## Problem Statement

Understanding what legislation representatives sponsor and support is key to informed civic engagement. Currently, users must research bills separately on Congress.gov or other sites. Integrating bill summaries and sponsorship data would help users understand their representatives' priorities and craft more relevant letters.

## Research Needed

- [ ] Evaluate Congress.gov API for bill data (summaries, sponsors, cosponsors)
- [ ] Evaluate GovTrack API for bill tracking features
- [ ] Evaluate ProPublica Congress API for bill data
- [ ] Understand data structures: bills, sponsors, cosponsors, subjects, status
- [ ] Research bill summary quality and availability
- [ ] Evaluate caching/storage requirements

## Open Questions

- Which API provides the best bill summary quality?
- Show only sponsored bills, or cosponsored too?
- How to categorize bills by topic/subject?
- Should summaries link to full bill text?
- How to handle bills without summaries?
- Real-time API vs periodic data sync?
- Should users be able to track/follow specific bills?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Data Points to Consider

- Bill number and title
- Sponsor vs cosponsor relationship
- Bill status (introduced, passed committee, passed house/senate, signed)
- Bill subjects/topics
- Official summary (CRS summaries)
- Introduction date
- Related bills
- Link to full text

### UI Considerations

- Section on rep profile page for sponsored/cosponsored bills
- Filter by status (active vs all)
- Filter by topic/subject
- Sort by date or relevance
- Bill status indicator (visual pipeline)
- Expandable summaries

### Future Enhancement

- Bill tracking/alerts feature (notify when bill status changes)
- Integration with template suggestions (templates related to pending bills)

## Verification

- [ ] Bill section displays on rep profile pages
- [ ] Shows both sponsored and cosponsored bills
- [ ] Summaries display correctly
- [ ] Links to full bill text work
- [ ] Filter by topic works
- [ ] Status indicators are accurate
- [ ] Data loads within acceptable time
- [ ] Handles bills without summaries gracefully
