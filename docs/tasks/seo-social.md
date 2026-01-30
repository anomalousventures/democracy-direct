# SEO & Social Sharing Optimization

## Status: Ready

## Problem Statement

Social media sharing is a key driver for civic engagement platforms. When users share links to Democracy Direct, the previews should be compelling and informative. Current meta tags may not be optimized for maximum engagement on Twitter, Facebook, and other platforms.

## Research Completed

- [x] Audit current meta tags on all page types
  - **Homepage**: `title="Home"` - NEEDS FIX, uses default description
  - **Templates index**: `title="Letter Templates"` - acceptable
  - **Template detail**: Uses template title + generated description from body - good
  - **Rep pages**: Uses rep name with party/state + custom description + ogImage (rep photo) - good
  - **ZIP pages**: Uses ZIP + state info - good
- [x] Review Layout.astro meta tag structure
  - Has proper OG and Twitter Card meta tags
  - Accepts `title`, `description`, `ogImage` props
  - Defaults: `description="Direct access to your democracy."`, `ogImage="/og-default.png"`
- [x] Check for existing OG images
  - `public/og-default.png` exists
  - `public/og-default.webp` exists
  - `public/og-image.svg` exists (source?)
- [x] Evaluate dynamic OG image generation options
  - Satori + @vercel/og is the standard for dynamic OG images
  - For Cloudflare Workers: satori-html + resvg-wasm works
  - **Recommendation**: Static images for now, dynamic later if needed

## Open Questions - Resolved

| Question                         | Decision                     | Rationale                                                           |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| Dynamic OG images for templates? | **No, defer**                | Static default is fine for MVP, adds complexity                     |
| Homepage title/description?      | **Custom copy**              | "Your Voice, Your Representatives" with privacy-focused description |
| Platform-specific meta tags?     | **Both OG + Twitter**        | Already implemented in Layout.astro                                 |
| Rep page OG images?              | **Already using rep photos** | Good - theunitedstates.io images                                    |

## Proposed Approach

1. Update homepage to pass custom title and description
2. Add description to templates index page
3. Test all pages with Facebook Sharing Debugger and Twitter Card Validator
4. Consider adding structured data (JSON-LD) for rep pages

## Implementation Tasks

1. Update `src/pages/index.astro` to use `title="Your Voice, Your Representatives"` instead of `title="Home"`
2. Update `src/pages/index.astro` to pass `description="Find and contact your elected officials with privacy-first letter templates. No account required. No data harvested."`
3. Update `src/pages/templates/index.astro` to pass `description="Browse community-contributed letter templates for contacting Congress on healthcare, environment, immigration, and more."`
4. Verify og-default.png dimensions are 1200x630 (recommended for social sharing)
5. Test homepage with Facebook Sharing Debugger at https://developers.facebook.com/tools/debug/
6. Test homepage with Twitter Card Validator at https://cards-dev.twitter.com/validator
7. Test a template detail page with both validators
8. Test a rep page with both validators
9. Add e2e test in `tests/e2e/seo-meta-tags.spec.ts` that verifies meta tags exist on key pages
10. Consider adding JSON-LD structured data for rep pages (Person schema) in a follow-up task

## Verification

- [ ] Homepage has compelling title (not "Home")
- [ ] Homepage has custom description
- [ ] Templates index has description
- [ ] All pages pass Facebook Sharing Debugger validation
- [ ] All pages pass Twitter Card Validator
- [ ] OG image displays correctly when shared
- [ ] E2E tests verify meta tags on homepage, template, and rep pages
