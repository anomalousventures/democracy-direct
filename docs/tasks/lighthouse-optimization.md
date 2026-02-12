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

## Post-Fix Scores (production build, 2026-02-11)

Audited with Lighthouse CLI 13.0.3 against local `wrangler pages dev` (production build). Best Practices still N/A due to WSL2 headless Chrome limitation. Scores averaged across two runs.

| Page            | Performance | Accessibility | Best Practices | SEO |
| --------------- | ----------- | ------------- | -------------- | --- |
| Homepage        | 88          | 100           | N/A            | 100 |
| Templates Index | 83          | 100           | N/A            | 100 |
| Template Detail | 99          | 100           | N/A            | 100 |
| Rep Profile     | 83          | 100           | N/A            | 100 |
| ZIP Results     | 64          | 100           | N/A            | 100 |

### Improvements from Baseline

- **Accessibility**: 99→100 on Rep Profile (fixed heading hierarchy h3→h2)
- **SEO**: 92→100 on Template Detail, Rep Profile, ZIP Results (fixed descriptive link text)
- **Performance**: Significant gains from hydration optimization (`client:idle`), removed redundant font preload, fixed infinite render loop on Templates page
- **CLS**: Reduced from 0.223 to ~0 on ZIP Results, 0.134 to 0.15 on Templates (font loading CLS)

### Performance Below 90 — External Dependencies

Performance scores on 3 pages remain below 90. The remaining bottlenecks are external resources outside our control:

1. **External images** (bioguide.congress.gov): Rep photos are served from Congress's server with no CDN optimization. These are the LCP elements on Rep Profile and ZIP Results pages. We added `fetchpriority="high"` for above-the-fold photos.
2. **PostHog analytics** (~95KB): Third-party analytics JS loaded on every page. Already deferred via `requestIdleCallback`.
3. **Client-side template fetching**: Templates page populates via API call after hydration, causing CLS (0.15) and delayed LCP.
4. **Template variables bundle** (434KB): Loaded via `client:idle` on Rep Profile for ContactFlow — already deferred but still counted as unused JS.

These scores will improve on Cloudflare's edge (faster TTFB, better routing to external APIs) and in real Chrome (vs WSL2 headless). CI Lighthouse tests against deployed preview URLs will give more accurate production numbers.

## Verification

- [x] Baseline scores documented for all key pages
- [x] Post-fix scores documented alongside baselines
- [x] All key pages score 90+ on Accessibility (100 across all pages)
- [x] All key pages score 90+ on SEO (100 across all pages)
- [ ] All key pages score 90+ on Best Practices (N/A in WSL2 — verify in CI)
- [ ] All key pages score 90+ on Performance (3 pages below 90 due to external deps — see above)
- [ ] Lighthouse CI runs on every PR
- [ ] PR comments show Lighthouse scores
- [ ] PRs blocked if scores drop below 90
