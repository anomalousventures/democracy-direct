---
status: completed
created: 2026-02-11
started: 2026-02-11
completed: 2026-02-11
---

# Task: Fix Critical Performance Issues

## Description

Address render-blocking resources, large bundle sizes, and other performance issues identified in the Lighthouse audit to bring all pages to 90+ Performance scores.

## Background

The site uses Astro with React islands. The Tiptap editor (~100KB) should only load on pages that use it. Google Fonts are loaded with preconnect (good). The main performance concerns are render-blocking CSS/JS and ensuring proper code splitting.

## Reference Documentation

**Required:**

- Design: docs/tasks/lighthouse-optimization.md
- Baseline audit results from task-01

## Technical Requirements

1. Eliminate render-blocking CSS/JS resources flagged by Lighthouse
2. Ensure font loading uses `display=swap` for all Google Fonts
3. Verify Tiptap editor is not bundled on pages that don't use it (only loads on template editing pages)
4. Review and optimize any large JS bundles identified in the audit
5. Ensure proper use of Astro's partial hydration (`client:load`, `client:idle`, `client:visible`)

## Dependencies

- Baseline audit results from task-01 (must know which specific issues to fix)

## Implementation Approach

1. Review Lighthouse performance recommendations from the baseline audit
2. Check `src/layouts/Layout.astro` for render-blocking `<link>` or `<script>` tags; defer or async where appropriate
3. Verify Google Fonts link includes `&display=swap`
4. Audit which pages import Tiptap-related components; ensure they use `client:load` or `client:idle` and are not statically imported in the layout
5. Check if any React components use `client:load` when `client:idle` or `client:visible` would suffice (non-critical above-fold components)
6. Run `pnpm build` and review bundle output for unexpectedly large chunks
7. Add preload hints for critical resources if needed

## Acceptance Criteria

1. **No render-blocking resources**
   - Given any key page is audited with Lighthouse
   - When the "Eliminate render-blocking resources" diagnostic runs
   - Then no resources are flagged as render-blocking

2. **Font display swap**
   - Given fonts are loaded via Google Fonts
   - When the CSS link is inspected
   - Then `display=swap` is present in the font URL

3. **Tiptap code-split correctly**
   - Given a page that does not use the editor (e.g., `/`, `/rep/S000033`)
   - When the page's JS bundles are inspected
   - Then Tiptap-related code is not included in the bundle

4. **All key pages score 90+ Performance**
   - Given accessibility and performance fixes are applied
   - When Lighthouse runs against each key page
   - Then all five pages score 90 or higher on Performance

5. **Hydration directives optimized**
   - Given React islands exist on various pages
   - When their hydration directives are reviewed
   - Then non-critical components use `client:idle` or `client:visible` instead of `client:load`

## Metadata

- **Complexity**: Medium
- **Labels**: performance, optimization, bundle-size
- **Required Skills**: Astro, bundling, performance optimization
