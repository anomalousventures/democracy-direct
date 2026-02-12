---
status: completed
created: 2026-02-11
started: 2026-02-11
completed: 2026-02-11
---

# Task: Run Baseline Lighthouse Audits

## Description

Establish performance baselines by running Lighthouse audits on all five key pages and recording scores. These baselines will guide prioritization of fixes and measure improvement.

## Background

The site currently has no Lighthouse baseline data. Five key pages have been identified as the highest-traffic and most complex pages: homepage, templates index, template detail, rep profile, and ZIP results. Each page needs scores for Performance, Accessibility, Best Practices, and SEO.

## Reference Documentation

**Required:**

- Design: docs/tasks/lighthouse-optimization.md

## Technical Requirements

1. Run Lighthouse audit (via Chrome DevTools or CLI) on each of the five pages
2. Record all four category scores per page in the baseline table in the design doc
3. Capture and list specific recommendations from Lighthouse for any category scoring below 90
4. Save full Lighthouse reports (HTML or JSON) for reference

## Dependencies

- Site must be running locally via `pnpm dev` or against a deployed preview
- Chrome browser or `lighthouse` CLI installed

## Implementation Approach

1. Start the dev server with `pnpm dev`
2. For each page (`/`, `/templates`, `/templates/{any-slug}`, `/rep/S000033`, `/zip/97201`), run Lighthouse in Chrome DevTools or via CLI
3. Record Performance, Accessibility, Best Practices, and SEO scores in the design doc table
4. Create a summary list of all recommendations where any category is below 90
5. Group recommendations by category (accessibility, performance, SEO, best practices) for follow-up tasks

## Acceptance Criteria

1. **Homepage audited**
   - Given the dev server is running
   - When Lighthouse runs against `/`
   - Then all four scores are recorded in the baseline table

2. **Templates index audited**
   - Given the dev server is running
   - When Lighthouse runs against `/templates`
   - Then all four scores are recorded in the baseline table

3. **Template detail audited**
   - Given the dev server is running
   - When Lighthouse runs against a template detail page
   - Then all four scores are recorded in the baseline table

4. **Rep profile audited**
   - Given the dev server is running
   - When Lighthouse runs against `/rep/S000033` (or similar)
   - Then all four scores are recorded in the baseline table

5. **ZIP results audited**
   - Given the dev server is running
   - When Lighthouse runs against `/zip/97201` (or similar)
   - Then all four scores are recorded in the baseline table

6. **Recommendations documented**
   - Given all audits are complete
   - When any category scores below 90
   - Then specific Lighthouse recommendations are listed and categorized

## Metadata

- **Complexity**: Low
- **Labels**: performance, audit, documentation
- **Required Skills**: Lighthouse, Chrome DevTools
