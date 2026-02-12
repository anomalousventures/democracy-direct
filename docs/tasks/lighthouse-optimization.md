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
  - ZIP/District results (`/reps/[state]/[district]`) — note: `/zip/[zip]` route does not exist

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

## Baseline Scores (dev server, 2026-02-11)

Audited with Lighthouse CLI 13.0.3 against local dev server. Note: dev server scores are lower than production due to unminified JS, Vite dev toolbar, and HMR client. Best Practices was N/A due to a WSL2 headless Chrome limitation (charset gatherer error). The ZIP Results page (`/zip/[zip]`) does not exist; `/reps/OR/3` (district results) was audited instead.

| Page            | Performance | Accessibility | Best Practices | SEO |
| --------------- | ----------- | ------------- | -------------- | --- |
| Homepage        | 55          | 100           | N/A            | 100 |
| Templates Index | 59          | 100           | N/A            | 100 |
| Template Detail | 79          | 100           | N/A            | 92  |
| Rep Profile     | 59          | 99            | N/A            | 92  |
| ZIP Results     | 55          | 100           | N/A            | 92  |

## Recommendations by Category

### Performance (all pages < 90)

Dev-only issues (will not affect production):

- Unminified JS (Vite serves raw modules in dev)
- @vite/client and dev toolbar (~560KB combined)
- Unused CSS from full Tailwind dev stylesheet

Production-relevant issues:

- **Tiptap loaded on Rep Profile**: `@tiptap/starter-kit` (613KB chunk) loads on `/rep/S000033` which doesn't use the editor — needs code splitting fix
- **Large external images**: Rep photos from `bioguide.congress.gov` are uncompressed (~1MB), need `loading="lazy"`
- **CLS on ZIP Results**: 0.223 CLS — layout shifts likely from async content loading
- **CLS on Templates Index**: 0.134 CLS
- **Server response time**: Template Detail (740ms) and Rep Profile (890ms) are slow in dev

### Accessibility (Rep Profile at 99)

- **Heading order**: `h3` inside Radix tabs content without a preceding `h2` — heading elements not in sequentially-descending order

### SEO (3 pages at 92)

- **Non-descriptive link text** on Template Detail, Rep Profile, and ZIP Results — generic link text like "Read more" should be more descriptive

### Best Practices

Unable to measure due to WSL2 headless Chrome limitation. Will verify in CI.

## Verification

- [x] Baseline scores documented for all key pages
- [ ] All key pages score 90+ on Performance
- [ ] All key pages score 90+ on Accessibility
- [ ] All key pages score 90+ on Best Practices
- [ ] All key pages score 90+ on SEO
- [ ] Lighthouse CI runs on every PR
- [ ] PR comments show Lighthouse scores
- [ ] PRs blocked if scores drop below 90
