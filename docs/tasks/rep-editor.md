# Rep Page Editor/Preview Streamlining

## Status: Research

## Problem Statement

The current flow from selecting a representative to composing, previewing, and printing a letter may have friction points. Users need a smooth experience to compose letters, preview them with substituted variables, and print formatted letters for mailing. Any unnecessary steps or confusing UX reduces civic participation.

## Research Needed

- [ ] Map current user journey: template selection → ZIP lookup → rep selection → letter composition → preview → print
- [ ] Identify pain points in current ContactFlow component
- [ ] Review LetterComposer and TiptapEditor for usability issues
- [ ] Test print flow on multiple browsers (Chrome, Firefox, Safari)
- [ ] Evaluate mobile experience for letter composition
- [ ] Review current print CSS for proper formatting

## Open Questions

- What are the main friction points in the current flow?
- Is the template variable substitution clear to users?
- Does the print preview accurately reflect printed output?
- How does the mobile experience compare to desktop?
- Are the user info inputs (name, city) discoverable enough?
- Should there be a "preview mode" before print?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### Current Components to Audit

- `src/components/ContactFlow.tsx` - Main flow orchestrator
- `src/components/LetterComposer.tsx` - Letter editing interface
- `src/components/TiptapEditor.tsx` - Rich text editor
- `src/components/UserInfoInputs.tsx` - User name/city fields
- `src/components/PrintAddressForm.tsx` - Return address for printing
- Print CSS in Layout.astro

### Potential Improvements

- Clearer variable insertion UI
- Better print preview
- Simplified step progression
- Mobile-optimized composition
- Progress indicator showing current step

## Verification

- [ ] User can complete full flow without confusion
- [ ] Variable substitution is clear and intuitive
- [ ] Print preview matches actual print output
- [ ] Print CSS hides non-letter elements
- [ ] Mobile users can compose and print letters
- [ ] All browsers produce consistent print output
- [ ] User info persists correctly across sessions
