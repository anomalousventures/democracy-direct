# Sitemap: Dynamic Pages

## Status: Complete

## Problem Statement

The current sitemap only includes static pages. Dynamic pages like representative profiles (`/rep/[bioguideId]`) and public templates (`/templates/[slug]`) are not included, which hurts SEO discoverability.

## Solution

Implemented a custom `/sitemap.xml` endpoint that queries the database for all legislators and public approved templates. This approach:

- Returns always-current data (no rebuild needed)
- Works with server-rendered routes
- Has 1-hour cache for performance
- Follows existing API endpoint patterns

## Files Changed

| File                       | Change                             |
| -------------------------- | ---------------------------------- |
| `src/lib/sitemap.ts`       | NEW - XML generation utilities     |
| `src/lib/sitemap.test.ts`  | NEW - Unit tests for sitemap utils |
| `src/pages/sitemap.xml.ts` | NEW - Custom sitemap endpoint      |
| `astro.config.mjs`         | Removed `@astrojs/sitemap` package |
| `public/robots.txt`        | Updated sitemap URL                |
| `package.json`             | Removed `@astrojs/sitemap` dep     |

## Implementation Details

### Sitemap Utilities (`src/lib/sitemap.ts`)

- `SitemapEntry` interface with loc, lastmod, changefreq, priority
- `formatDate()` - Formats dates as YYYY-MM-DD
- `generateSitemapXml()` - Generates valid sitemap XML with proper escaping

### Sitemap Endpoint (`src/pages/sitemap.xml.ts`)

- Queries database for all legislators and public approved templates
- Static pages: /, /about, /privacy, /roadmap, /templates
- Dynamic pages: /rep/[bioguideId] (~535 pages), /templates/[slug]
- Returns XML with Content-Type: application/xml
- 1-hour cache via Cache-Control header

### robots.txt

Updated to reference `/sitemap.xml` instead of `/sitemap-index.xml`.

## Verification

- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm test` passes (9 sitemap tests)
- [x] `/sitemap.xml` returns valid XML
- [x] Sitemap includes static pages
- [x] Sitemap includes all legislators
- [x] Sitemap includes public approved templates
- [x] robots.txt references `/sitemap.xml`
- [x] `@astrojs/sitemap` package removed
