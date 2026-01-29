# Lighthouse Optimization

## Problem Statement

Site performance, accessibility, SEO, and best practices should be continuously monitored and optimized. Lighthouse provides actionable metrics and recommendations. We should establish baseline scores, identify issues, and systematically improve them.

## Research Needed

- [ ] Run Lighthouse audits on key pages (home, templates, rep profile, ZIP results)
- [ ] Document current scores for Performance, Accessibility, Best Practices, SEO
- [ ] Identify lowest-hanging fruit improvements
- [ ] Review Core Web Vitals (LCP, FID, CLS)
- [ ] Check mobile vs desktop scores

## Open Questions

- What are our target scores? (90+ across all categories?)
- Which pages are most critical to optimize first?
- Are there any blocking issues (large bundles, render-blocking resources)?
- How to integrate Lighthouse into CI for regression prevention?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Performance

- [ ] Audit bundle sizes (especially Tiptap, map libraries if added)
- [ ] Optimize images (WebP, lazy loading, proper sizing)
- [ ] Review render-blocking resources
- [ ] Implement code splitting where beneficial
- [ ] Check font loading strategy
- [ ] Review caching headers

### Accessibility

- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Verify color contrast ratios
- [ ] Check heading hierarchy
- [ ] Ensure all images have alt text
- [ ] Test with screen reader
- [ ] Verify focus indicators

### Best Practices

- [ ] HTTPS everywhere
- [ ] No console errors
- [ ] No deprecated APIs
- [ ] Proper image aspect ratios

### SEO

- [ ] Meta descriptions on all pages
- [ ] Proper heading structure
- [ ] Crawlable links
- [ ] Mobile-friendly viewport
- [ ] Valid robots.txt and sitemap

### CI Integration

- [ ] Add Lighthouse CI to GitHub Actions
- [ ] Set score thresholds for PR checks
- [ ] Generate reports for review

## Verification

- [ ] All key pages score 90+ on Performance
- [ ] All key pages score 90+ on Accessibility
- [ ] All key pages score 90+ on Best Practices
- [ ] All key pages score 90+ on SEO
- [ ] Core Web Vitals pass thresholds
- [ ] Lighthouse CI integrated and blocking regressions
