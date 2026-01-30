# Lighthouse Optimization

## Status: Ready

## Problem Statement

Site performance, accessibility, SEO, and best practices should be continuously monitored and optimized. Lighthouse provides actionable metrics and recommendations. We should establish baseline scores, identify issues, and systematically improve them.

## Research Completed

- [x] Review current tech stack for known performance considerations
  - Astro with React islands - generally good for performance
  - Tiptap editor - ~100kb bundle, only loads on pages that need it
  - Font loading: Google Fonts with preconnect (good)
  - Images: Rep photos from external CDN (theunitedstates.io)
- [x] Review existing CI setup
  - `.github/workflows/ci.yml` runs lint, typecheck, tests
  - No Lighthouse CI currently configured
- [x] Identify key pages to audit
  - Homepage (`/`)
  - Templates index (`/templates`)
  - Template detail (`/templates/[slug]`)
  - Rep profile (`/rep/[bioguideId]`)
  - ZIP results (`/zip/[zip]`)

## Open Questions - Resolved

| Question            | Decision                   | Rationale                       |
| ------------------- | -------------------------- | ------------------------------- |
| Target scores?      | **90+ all categories**     | Industry standard for good UX   |
| Which pages first?  | **Homepage + Rep profile** | Highest traffic, most complex   |
| Add to CI?          | **Yes, as PR check**       | Prevent regressions             |
| Lighthouse CI tool? | **@lhci/cli**              | Official, GitHub Action support |

## Proposed Approach

1. Run manual Lighthouse audits to establish baselines
2. Fix critical issues identified in audit
3. Add Lighthouse CI to GitHub Actions
4. Set score thresholds to prevent regressions

## Implementation Tasks

1. Run Lighthouse audit on homepage in Chrome DevTools and record baseline scores in this doc
2. Run Lighthouse audit on `/templates` and record baseline scores
3. Run Lighthouse audit on a template detail page and record baseline scores
4. Run Lighthouse audit on `/rep/S000033` (or any rep page) and record baseline scores
5. Run Lighthouse audit on `/zip/97201` (or any ZIP page) and record baseline scores
6. Create GitHub issue listing all Lighthouse recommendations with scores <90
7. Fix any critical accessibility issues (color contrast, missing alt text, focus indicators)
8. Fix any critical performance issues (render-blocking resources, large bundles)
9. Verify og-default.png is optimized (compress if >100kb)
10. Add lazy loading to rep photos if not already present
11. Install `@lhci/cli` as dev dependency
12. Create `lighthouserc.js` config file with URL list and score assertions (90 threshold)
13. Create `.github/workflows/lighthouse.yml` workflow that runs on PR
14. Configure Lighthouse CI to post results as PR comment
15. Add Lighthouse CI status check as required for merge

## Baseline Scores (to be filled during audit)

| Page            | Performance | Accessibility | Best Practices | SEO |
| --------------- | ----------- | ------------- | -------------- | --- |
| Homepage        | TBD         | TBD           | TBD            | TBD |
| Templates Index | TBD         | TBD           | TBD            | TBD |
| Template Detail | TBD         | TBD           | TBD            | TBD |
| Rep Profile     | TBD         | TBD           | TBD            | TBD |
| ZIP Results     | TBD         | TBD           | TBD            | TBD |

## Verification

- [ ] Baseline scores documented for all key pages
- [ ] All key pages score 90+ on Performance
- [ ] All key pages score 90+ on Accessibility
- [ ] All key pages score 90+ on Best Practices
- [ ] All key pages score 90+ on SEO
- [ ] Lighthouse CI runs on every PR
- [ ] PR comments show Lighthouse scores
- [ ] PRs blocked if scores drop below 90
