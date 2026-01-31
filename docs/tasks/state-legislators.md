# State Legislators

## Status: Research

## Problem Statement

Users want to contact their state-level representatives (state senators and state assembly/house members) in addition to federal Congress members. State legislators often have more direct impact on daily life through education, healthcare, criminal justice, and local infrastructure decisions.

## Research Tasks

- [ ] Identify data sources for state legislator information
  - Open States API (https://openstates.org/) - covers all 50 states
  - Individual state legislature websites
  - Ballotpedia API
- [ ] Evaluate data completeness (contact info, district boundaries, photos)
- [ ] Research state district lookup by address (more complex than federal)
- [ ] Determine if existing ZIP-to-district approach works for state level
- [ ] Review Open States API rate limits and terms of use
- [ ] Estimate storage requirements for all state legislators (~7,400 total)

## Open Questions

| Question                                          | Notes                                          |
| ------------------------------------------------- | ---------------------------------------------- |
| Which data source is most reliable?               | Open States is the leading option              |
| How to handle bicameral vs unicameral (Nebraska)? | Need flexible schema                           |
| State district boundaries vs federal?             | Different, need separate lookup                |
| Address-level lookup required?                    | ZIP codes don't map cleanly to state districts |
| How to present alongside federal reps?            | Separate section or combined view?             |

## Proposed Approach

TBD after research phase.

## Implementation Tasks

TBD after research phase.

## Privacy Considerations

- State districts are smaller than federal districts
- May need address-level lookup (more precise than ZIP)
- Consider privacy implications of storing more precise location data
- Maintain opt-in approach for saving preferences

## Verification

TBD after implementation tasks defined.
