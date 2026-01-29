# Share Buttons

## Problem Statement

Users who find useful templates or want to encourage others to contact their representatives need easy ways to share content. Currently there are no share buttons on template detail pages or rep profile pages, limiting organic growth and civic engagement.

## Research Needed

- [ ] Survey existing share button implementations (react-share, custom, native Web Share API)
- [ ] Evaluate which platforms to support (Twitter/X, Facebook, Reddit, email, copy link)
- [ ] Review current page structure for optimal placement
- [ ] Consider mobile vs desktop UX (native share vs explicit buttons)
- [ ] Investigate Web Share API browser support and fallback strategy

## Open Questions

- Should share buttons appear on both templates and rep pages?
- What share text should be pre-populated for each page type?
- Should we track share events via PostHog?
- Web Share API on mobile vs explicit buttons on desktop?
- Should there be a "Copy Link" option alongside social shares?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Likely Pages

- `/templates/[slug]` - Template detail pages
- `/rep/[bioguideId]` - Representative profile pages
- Possibly `/zip/[zip]` - Results pages

### Share Text Ideas

Template: "Check out this letter template for contacting your representatives: [title]"
Rep: "Contact [Rep Name] about issues that matter to you"

## Verification

- [ ] Share buttons visible on template detail pages
- [ ] Share buttons visible on rep profile pages
- [ ] Twitter share opens with correct pre-filled text
- [ ] Facebook share shows correct OG preview
- [ ] Reddit share works correctly
- [ ] Email share opens mail client with subject/body
- [ ] Copy link works and shows confirmation
- [ ] Mobile uses Web Share API when available
- [ ] Desktop shows explicit platform buttons
