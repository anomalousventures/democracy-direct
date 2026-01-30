# Sitemap: Dynamic Pages

## Status: Ready

## Problem Statement

The current sitemap only includes static pages. Dynamic pages like representative profiles (`/rep/[bioguideId]`) and public templates (`/templates/[slug]`) are not included, which hurts SEO discoverability.

Search engines rely on sitemaps to discover and index pages. Without these dynamic pages in the sitemap:

- Rep pages won't be indexed efficiently
- Template pages won't appear in search results
- Users searching for specific representatives or civic topics won't find our pages

## Research Tasks

- [ ] Check current sitemap configuration in `astro.config.mjs`
- [ ] Review Astro's `@astrojs/sitemap` integration options
- [ ] Determine if custom sitemap entries can be added at build time
- [ ] Check if legislators and templates data is available at build time
- [ ] Review how other Astro sites handle dynamic sitemaps

## Proposed Approach

### Option A: Build-time sitemap generation (Preferred)

Generate sitemap entries at build time by querying the database for:

1. All legislators (for `/rep/[bioguideId]` pages)
2. All public, approved templates (for `/templates/[slug]` pages)

**Pros:**

- Fast sitemap serving (static file)
- No runtime overhead
- Works with CDN caching

**Cons:**

- Sitemap only updates on deploy
- New templates won't appear until next build

### Option B: Dynamic sitemap endpoint

Create an API route that generates sitemap XML on demand.

**Pros:**

- Always up-to-date

**Cons:**

- Runtime database queries
- Slower response time
- May hit rate limits with frequent crawls

### Recommendation

**Option A** - Build-time generation is preferred because:

- Legislators rarely change (only on data refresh)
- Templates update infrequently
- We can trigger rebuilds when data changes
- Better performance for search engine crawlers

## Implementation Tasks

### Research & Setup

1. Verify `@astrojs/sitemap` is installed and configured
2. Review Astro sitemap customization options (`customPages`, `serialize`)
3. Determine build-time database access pattern

### Sitemap Generation

4. Create `src/lib/sitemap.ts` with functions to fetch sitemap entries
5. Query all legislators for rep page URLs
6. Query all public, approved templates for template page URLs
7. Configure sitemap integration to include dynamic pages

### Build Integration

8. Ensure database connection works at build time
9. Add sitemap generation to build process
10. Verify sitemap includes all expected URLs

### Validation

11. Test sitemap XML is valid
12. Verify all rep pages are included (~535 legislators)
13. Verify all public templates are included
14. Submit updated sitemap to Google Search Console

## Expected Sitemap Entries

```
https://democracydirect.us/                     # Homepage
https://democracydirect.us/about                # About
https://democracydirect.us/privacy              # Privacy
https://democracydirect.us/roadmap              # Roadmap
https://democracydirect.us/templates            # Templates list
https://democracydirect.us/rep/S000033          # Bernie Sanders
https://democracydirect.us/rep/P000197          # Nancy Pelosi
... (all ~535 legislators)
https://democracydirect.us/templates/healthcare-access
https://democracydirect.us/templates/climate-action
... (all public approved templates)
```

## Technical Notes

### Astro Sitemap Config

```javascript
// astro.config.mjs
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://democracydirect.us",
  integrations: [
    sitemap({
      customPages: [
        // Can add custom URLs here
      ],
      serialize(item) {
        // Can modify entries here
      },
    }),
  ],
});
```

### Alternative: Custom Sitemap Generation

If `@astrojs/sitemap` doesn't support build-time DB queries, create a custom solution:

1. Add pre-build script to generate sitemap XML
2. Query database for all legislators and templates
3. Write `public/sitemap.xml` directly
4. Run before main Astro build

## Verification

- [ ] Sitemap includes all static pages
- [ ] Sitemap includes all legislator rep pages (~535)
- [ ] Sitemap includes all public approved templates
- [ ] Sitemap XML validates (use Google's validator)
- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] robots.txt references sitemap location
- [ ] Google Search Console accepts sitemap submission
- [ ] Build time remains reasonable (< 5 min)

## Priority

Medium-High - Good SEO improvement with relatively low effort. Should be done before major marketing push.

## Dependencies

- Database must be accessible at build time
- Legislators data must be seeded
- Templates must exist in database

## Cloudflare Build Environment

**Key Question:** Are Cloudflare secrets (DATABASE_URL) available at build time?

**Answer:** Yes, environment variables set in Cloudflare Pages dashboard (Settings > Environment Variables) are available during the build process. Both "plaintext" and "encrypted" variables are accessible.

**Verification needed:**

- [ ] Confirm DATABASE_URL is set in Cloudflare Pages environment variables (not just wrangler.toml)
- [ ] Test that build process can connect to Neon database
- [ ] Ensure connection string uses pooled connection for build (not direct)

**Fallback if build-time DB access fails:**

1. Create a pre-deploy script that generates sitemap and commits to repo
2. Or create a GitHub Action that generates sitemap on data refresh
3. Or use a static export of legislators (JSON file) that's updated on data refresh
