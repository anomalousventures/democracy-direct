# Local Officials

## Status: Research

## Problem Statement

Users want to contact local government officials (mayors, city council members, county commissioners, school board members) who make decisions directly affecting their communities. Local officials are often the most accessible and responsive to constituent contact, yet finding their contact information can be difficult.

## Research Tasks

- [ ] Identify data sources for local official information
  - Google Civic Information API (covers some local offices)
  - Ballotpedia (limited local coverage)
  - Individual municipality websites (fragmented)
  - State associations of counties/municipalities
- [ ] Evaluate feasibility of comprehensive local coverage
- [ ] Research which local offices are most commonly sought
  - Mayor / City Manager
  - City Council / Board of Aldermen
  - County Commissioner / Supervisor
  - School Board
  - Sheriff
- [ ] Determine address-level lookup requirements
- [ ] Assess data maintenance burden (local officials change frequently)
- [ ] Research existing civic tech solutions for local data

## Open Questions

| Question                              | Notes                                            |
| ------------------------------------- | ------------------------------------------------ |
| Which local offices to prioritize?    | Mayor, City Council, School Board most requested |
| Data source reliability?              | Google Civic API has gaps, no single source      |
| How to handle 35,000+ municipalities? | May need to start with major cities              |
| Update frequency?                     | Local elections happen off-cycle, terms vary     |
| User-submitted data?                  | Community contributions could help fill gaps     |

## Proposed Approach

TBD after research phase.

## Implementation Tasks

TBD after research phase.

## Privacy Considerations

- Local lookup requires precise address (not just ZIP)
- Must be clear about what address data is stored/used
- Consider allowing lookup without saving address
- Local districts can be very small (neighborhood level)

## Verification

TBD after implementation tasks defined.
