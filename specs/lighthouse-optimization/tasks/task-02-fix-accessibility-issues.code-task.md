---
status: completed
created: 2026-02-11
started: 2026-02-11
completed: 2026-02-11
---

# Task: Fix Critical Accessibility Issues

## Description

Address all accessibility issues identified in the Lighthouse baseline audit that cause scores below 90. Also optimize og-default.png and add lazy loading to rep photos.

## Background

Lighthouse accessibility audits check for WCAG AA compliance including color contrast ratios, alt text, form labels, and focus indicators. Rep photos are loaded from theunitedstates.io CDN and may benefit from lazy loading. The og-default.png image should be under 100KB for optimal sharing performance.

## Reference Documentation

**Required:**

- Design: docs/tasks/lighthouse-optimization.md
- Baseline audit results from task-01

## Technical Requirements

1. Fix all color contrast issues to meet WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
2. Ensure all images have appropriate alt text (decorative images use `alt=""`)
3. Ensure all form inputs have associated `<label>` elements or `aria-label` attributes
4. Verify focus indicators are visible on all interactive elements (buttons, links, inputs)
5. Compress og-default.png to under 100KB if it exceeds that size
6. Add `loading="lazy"` to rep photo `<img>` elements

## Dependencies

- Baseline audit results from task-01 (must know which specific issues to fix)

## Implementation Approach

1. Review Lighthouse accessibility recommendations from the baseline audit
2. Audit color contrast across all affected components; adjust CSS variables or Tailwind classes
3. Add missing alt text to images in layouts and components
4. Add labels to any unlabeled form inputs (especially in ZipLookup and ContactFlow components)
5. Verify keyboard focus styles exist; add `focus-visible` ring styles if missing
6. Check `public/og-default.png` file size; compress with a tool like `sharp` or `squoosh` if over 100KB
7. Add `loading="lazy"` to rep photo images in the rep profile page

## Acceptance Criteria

1. **Color contrast passes**
   - Given all pages are rendered
   - When Lighthouse checks color contrast
   - Then no color contrast failures are reported (WCAG AA)

2. **Images have alt text**
   - Given pages with images are rendered
   - When Lighthouse checks image alt attributes
   - Then all content images have descriptive alt text and decorative images have `alt=""`

3. **Form inputs labeled**
   - Given pages with forms are rendered
   - When Lighthouse checks form labels
   - Then all form inputs have associated labels or aria-label attributes

4. **Focus indicators visible**
   - Given a user navigates via keyboard
   - When interactive elements receive focus
   - Then a visible focus indicator is displayed

5. **OG image optimized**
   - Given `public/og-default.png` exists
   - When its file size is checked
   - Then it is under 100KB

6. **Rep photos lazy loaded**
   - Given a rep profile page is rendered
   - When the rep photo `<img>` element is inspected
   - Then it has the `loading="lazy"` attribute

## Metadata

- **Complexity**: Medium
- **Labels**: accessibility, performance, a11y
- **Required Skills**: HTML accessibility, CSS, image optimization
