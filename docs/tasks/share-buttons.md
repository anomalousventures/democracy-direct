# Share Buttons

## Status: In Progress

## Problem Statement

Users who find useful templates or want to encourage others to contact their representatives need easy ways to share content. Currently there are no share buttons on template detail pages or rep profile pages, limiting organic growth and civic engagement.

## Research Completed

- [x] Survey existing share button implementations
  - **react-share**: Popular but last updated 2023, ~10kb bundle
  - **Custom implementation**: Simple, smaller, full control
  - **Recommendation**: Custom implementation - share URLs are just URL patterns
- [x] Evaluate Web Share API browser support
  - ✅ iOS Safari, Android Chrome, macOS Safari, Windows Edge
  - ✅ Desktop Chrome (supported since v89, Feb 2021)
  - ⚠️ Desktop Firefox (behind flag, inconsistent)
  - **Strategy**: Feature detection with `navigator.share`, fallback to explicit buttons
- [x] Evaluate which platforms to support
  - X/Twitter, Facebook, Reddit, Email, Copy Link
  - LinkedIn optional (less relevant for civic content)
- [x] Review current page structure for optimal placement
  - Template pages: Below template title, above body
  - Rep pages: In the header area near rep name

## Open Questions - Resolved

| Question                       | Decision                  | Rationale                               |
| ------------------------------ | ------------------------- | --------------------------------------- |
| Which pages?                   | **Templates + Rep pages** | Highest value for sharing               |
| Pre-populated share text?      | **Yes**                   | Custom text per page type               |
| Track via PostHog?             | **Yes**                   | Useful for understanding engagement     |
| Web Share vs explicit buttons? | **Both**                  | Web Share on mobile, buttons on desktop |
| Copy Link option?              | **Yes**                   | Always useful fallback                  |

## Proposed Approach

1. Create reusable ShareButtons component
2. Detect Web Share API support for mobile optimization
3. Add to template detail and rep profile pages
4. Track share events via PostHog

## Implementation Tasks

1. Create `src/lib/share.ts` with share URL generators for each platform (Twitter, Facebook, Reddit, Email)
2. Create `src/components/ShareButtons.tsx` that accepts `url`, `title`, and `description` props
3. Add Web Share API detection: `typeof navigator.share === 'function'`
4. Implement mobile view: single "Share" button that triggers `navigator.share()`
5. Implement desktop view: row of platform buttons (X, Facebook, Reddit, Email, Copy Link)
6. Add copy-to-clipboard functionality with success toast feedback
7. Add PostHog tracking: `posthog.capture('share_clicked', { platform, pageType, slug })`
8. Add ShareButtons to `src/pages/templates/[slug].astro` below the template title
9. Add ShareButtons to `src/pages/rep/[bioguideId].astro` in the rep header area
10. Style buttons to match existing card-civic design patterns
11. Add unit tests for share URL generators in `src/lib/share.test.ts`
12. Add e2e test in `tests/e2e/share-buttons.spec.ts` that verifies buttons appear and copy link works

## Share Text Templates

**Template pages:**

- Twitter: `Check out this letter template for contacting Congress: "{title}" {url}`
- Facebook: Uses OG tags (no custom text needed)
- Reddit: Title = template title, URL = page URL
- Email: Subject = `Letter Template: {title}`, Body = `I found this useful template for contacting representatives:\n\n{url}`

**Rep pages:**

- Twitter: `Contact {Rep Name} ({party}-{state}) about issues that matter to you: {url}`
- Facebook: Uses OG tags
- Reddit: Title = `Contact {Rep Name}`, URL = page URL
- Email: Subject = `Contact {Rep Name}`, Body = `Here's how to contact {Rep Name}:\n\n{url}`

## Privacy Considerations

- No third-party share tracking scripts
- PostHog tracking is first-party only
- Share buttons don't load external resources until clicked

## Verification

- [ ] Share buttons visible on template detail pages
- [ ] Share buttons visible on rep profile pages
- [ ] Mobile shows native share sheet via Web Share API
- [ ] Desktop shows explicit platform buttons
- [ ] Twitter share opens with correct pre-filled text
- [ ] Facebook share shows correct OG preview
- [ ] Reddit share works correctly
- [ ] Email share opens mail client with subject/body
- [ ] Copy link works and shows confirmation toast
- [ ] PostHog events fire on share clicks
- [ ] Unit tests pass for share URL generators
- [ ] E2E tests pass for share button interactions
