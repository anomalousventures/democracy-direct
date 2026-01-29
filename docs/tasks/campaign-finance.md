# Campaign Finance Data Integration

## Problem Statement

Understanding who funds representatives helps voters make informed decisions about their elected officials. Campaign finance data reveals potential conflicts of interest and influence patterns. Currently, users must visit external sites (FEC, OpenSecrets) to research this information.

## Research Needed

- [ ] Evaluate FEC API for contribution data (bulk data vs real-time API)
- [ ] Evaluate OpenSecrets API for processed/aggregated data
- [ ] Compare data freshness and accuracy between sources
- [ ] Understand data structures: contributions, donors, industries, PACs
- [ ] Research caching/storage strategy (data can be large)
- [ ] Review legal/terms of service for data display

## Open Questions

- FEC raw data vs OpenSecrets processed data - which is more appropriate?
- How to handle the volume of contribution data (aggregation strategy)?
- What time period should be displayed (current cycle, career)?
- How to categorize donors (individual, PAC, industry)?
- Should we show top donors, industry breakdown, or both?
- API rate limits and caching requirements?
- Storage needs if caching locally?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Data Points to Consider

- Total raised (current cycle, career)
- Top individual donors
- Top industry/sector contributors
- PAC contributions
- Small vs large donations breakdown
- In-state vs out-of-state contributions
- Comparison to peers (optional)

### UI Considerations

- Section on rep profile page
- Charts/visualizations for breakdown
- Links to full FEC filings
- Clear date ranges and disclaimers
- Mobile-friendly display

## Verification

- [ ] Campaign finance section displays on rep pages
- [ ] Data is accurate and matches official sources
- [ ] Clear attribution to data source (FEC/OpenSecrets)
- [ ] Appropriate disclaimers about data currency
- [ ] Charts/visualizations render correctly
- [ ] Links to official filings work
- [ ] Data loads within acceptable time
- [ ] Handles missing data gracefully
