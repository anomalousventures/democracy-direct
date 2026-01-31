# Template Descriptions

## Status: Ready

## Problem Statement

Templates currently lack a short description/summary field. The only text available is the full body content, which is too long and contains template variables that make it unsuitable for:

1. **Template list cards** - Need a brief summary to help users quickly scan and choose templates
2. **Meta descriptions** - SEO `<meta name="description">` tag content for better search results
3. **Social sharing** - OG/Twitter card descriptions for link previews

Currently, the template detail page strips template variables from the body and truncates it for meta descriptions, but this produces poor-quality summaries that lack context.

## Research Completed

- [x] Review current templates schema
  - `id`, `slug`, `title`, `body`, `issueTags`, `userId`, `isPublic`, etc.
  - **No description field exists**
- [x] Check how descriptions are currently generated
  - `[slug].astro` has `getCleanDescription()` that strips `{{VAR}}` patterns and truncates to 155 chars
  - Template list shows `body` directly (truncated in card component)
- [x] Review template creation/edit flow
  - `src/pages/templates/new.astro` and `src/pages/templates/[slug]/edit.astro`
  - Form has title, body, and tag selection
- [x] Check TemplateSearch component for list display
  - Uses `body` field, likely truncated in rendering

## Open Questions - Resolved

| Question                 | Decision                           | Rationale                                       |
| ------------------------ | ---------------------------------- | ----------------------------------------------- |
| Optional or required?    | **Optional**                       | Don't break existing templates                  |
| Max length?              | **200 chars**                      | Fits meta description limits                    |
| Fallback if empty?       | **Truncated body (current logic)** | Backwards compatible                            |
| Seed existing templates? | **Yes**                            | Better UX, SEO, and social sharing from day one |

## Proposed Approach

1. Add `description` column to templates table (nullable varchar(200))
2. Update template creation form to include description textarea
3. Update template edit form to include description textarea
4. Update TemplateSearch to display description (or fallback to truncated body)
5. Update template detail page to use description for meta tags
6. Update seed-templates script to include descriptions for seed data

## Implementation Tasks

### Schema & Migration

1. Add `description: varchar("description", { length: 200 })` to templates table in `src/db/schema.ts`
2. Run migration with `pnpm db:push` (dev)

### API Updates

3. Update `src/pages/api/templates/create.ts` to accept and validate description field
4. Update `src/pages/api/templates/[slug]/update.ts` to accept and validate description field

### Form Updates

5. Update `src/pages/templates/new.astro` form to include description textarea with 200-char limit
6. Update `src/pages/templates/[slug]/edit.astro` form to include description textarea

### Display Updates

7. Update `src/components/TemplateSearch.tsx` to display description (fallback to truncated body)
8. Update `src/pages/templates/[slug].astro` to use description for meta tags when available
9. Update `src/pages/templates/index.astro` query to select description field

### Seed Data

10. Update `src/scripts/seed-templates.ts` to include descriptions for all seed templates
11. Write meaningful descriptions for each seed template (concise, action-oriented)
12. Re-seed dev database: `pnpm db:seed` or equivalent
13. Re-seed prod database after deployment

### Testing

14. Add unit tests for API endpoint description validation
15. Add e2e test for description display in template list and detail pages

## Character Limit Rationale

- Google typically displays 150-160 characters in search results
- Twitter cards show up to 200 characters
- OG descriptions show ~200 characters
- **200 characters** provides enough room while encouraging conciseness

## Verification

- [ ] Description field appears in template creation form
- [ ] Description field appears in template edit form
- [ ] Description is saved to database correctly
- [ ] Description displays in template list (when available)
- [ ] Truncated body displays in template list (when description empty)
- [ ] Description used for meta description tag on detail page
- [ ] Fallback to truncated body for meta when description empty
- [ ] Description limited to 200 characters in form
- [ ] Existing templates without description continue to work
- [ ] All seed templates have descriptions
- [ ] Dev database re-seeded with descriptions
- [ ] Prod database re-seeded with descriptions after deployment
- [ ] Unit tests pass for API validation
- [ ] E2E tests pass for description display
