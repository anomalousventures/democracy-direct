# Template Bill Linking

## Status: Research

## Problem Statement

Letter templates are more powerful when connected to specific legislation. Users researching a bill should discover relevant templates, and users writing letters should be able to reference the specific bill they're writing about. Currently, templates exist in isolation from legislative data.

## Dependencies

- Bill Summaries integration (provides bill data to link against)

## Research Completed

- [x] Design bill picker UX for template create/edit form
  - Autocomplete input searching synced bills
  - Shows bill number + title when matched
- [x] Evaluate auto-detection of bill numbers in template body
  - Regex patterns for H.R.1234, S.567, etc.
  - Suggest linking when detected
- [x] Determine how to display linked bills on template detail page
  - "Related legislation" section with bill cards
- [x] Design "templates for this bill" browse/filter experience
  - `/templates?bill=H.R.1234` filter parameter
  - Shows bill context banner when filtered
- [x] Design "create template for this bill" pre-filled flow
  - `/templates/new?bill=H.R.1234` with bill pre-linked

## Open Questions - Resolved

| Question                      | Decision     | Rationale                                |
| ----------------------------- | ------------ | ---------------------------------------- |
| Bill linking required?        | **Optional** | Many templates are general-purpose       |
| Bills from previous Congress? | **Allow**    | Templates may reference historical bills |
| Multiple bills per template?  | **Yes**      | Some templates address multiple bills    |
| Auto-detect & suggest?        | **Yes**      | Helpful but non-blocking                 |
| Pre-fill template body?       | **No**       | Just link metadata, don't assume content |

## Proposed Approach

1. Add `linkedBillNumbers` field to templates schema
2. Create bill picker component with autocomplete
3. Add bill detection util for regex matching in text
4. Integrate bill linking into template create/edit forms
5. Add filtered templates view by bill
6. Add CTAs on bill/vote pages linking to templates

## Implementation Tasks

1. Add `linkedBillNumbers` column to templates table in `src/db/schema.ts` (string array, nullable)
2. Run database migration with `pnpm db:push`
3. Create `src/lib/bill-detection.ts` with `detectBillNumbers(text)` function using regex
4. Add unit tests for bill detection patterns in `src/lib/bill-detection.test.ts`
5. Create `src/components/BillPicker.tsx` with autocomplete searching bills table
6. Add BillPicker to template create form in `src/pages/templates/new.astro`
7. Add BillPicker to template edit form (if exists, or create it)
8. Handle `?bill=X` query param in `/templates/new` to pre-select bill
9. Add auto-detect feature: scan template body on blur, suggest unlinked bills found
10. Display linked bills on template detail page `src/pages/templates/[slug].astro`
11. Add bill filter param support to templates index page `src/pages/templates/index.astro`
12. Show bill context banner on `/templates?bill=X`: "Showing templates for H.R.1234: [Title]"
13. Handle zero results state: "No templates for this bill yet - create one?"
14. Update template queries in `src/db/queries/templates.ts` to filter by `linkedBillNumbers`
15. Add "See templates for this bill" button on bill detail page linking to `/templates?bill=X`
16. Add "Create a template for this bill" button on bill detail page linking to `/templates/new?bill=X`
17. Add e2e test in `tests/e2e/template-bill-linking.spec.ts` for bill picker and filtering

## Bill Number Patterns

Valid formats to detect/accept (normalized to standard format):

| Input                             | Normalized      |
| --------------------------------- | --------------- |
| `H.R.1234`, `HR1234`, `H.R. 1234` | `H.R.1234`      |
| `S.1234`, `S1234`, `S. 1234`      | `S.1234`        |
| `H.J.Res.123`, `HJRes123`         | `H.J.Res.123`   |
| `S.J.Res.123`                     | `S.J.Res.123`   |
| `H.Con.Res.123`                   | `H.Con.Res.123` |
| `S.Con.Res.123`                   | `S.Con.Res.123` |
| `H.Res.123`                       | `H.Res.123`     |
| `S.Res.123`                       | `S.Res.123`     |

## Schema Changes

```typescript
// templates table update
{
  // ... existing fields
  linkedBillNumbers: string[], // e.g., ["H.R.1234", "S.567"]
}
```

## UI Components

### BillPicker (template form)

- Text input with autocomplete
- Searches bills by number or title
- Shows: bill number, title (truncated), congress
- Multi-select: can add multiple bills
- Remove button on each selected bill

### Bill Context Banner (templates list)

```
📜 Showing templates for H.R.1234: Medicare for All Act
[Clear filter]
```

### Auto-Detection Toast

```
We found H.R.1234 mentioned in your template.
[Link it] [Dismiss]
```

## Verification

- [ ] Template form has bill picker with autocomplete
- [ ] Bill picker searches by number and title
- [ ] Multiple bills can be linked to one template
- [ ] Invalid bill numbers show error
- [ ] `/templates/new?bill=X` pre-selects the bill
- [ ] Auto-detect suggests bills found in template body
- [ ] Template detail page shows linked bills
- [ ] `/templates?bill=X` filters correctly
- [ ] Bill context banner shows when filtered
- [ ] Zero-template state shows create CTA
- [ ] Bill/vote pages have "See templates" button
- [ ] Bill/vote pages have "Create template" button
- [ ] Works for bills from previous Congress
- [ ] E2E tests pass
