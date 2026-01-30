# Public Roadmap

## Status: Research

## Problem Statement

Users visiting the site may want to know what features are planned. A public roadmap builds trust, sets expectations, and encourages community engagement. It also provides transparency about the project's direction and allows users to see that the project is actively developed.

## Research Needed

- [ ] Review roadmap implementations on similar civic/open-source projects
- [ ] Evaluate roadmap display formats (timeline, kanban, list)
- [ ] Determine which tasks from docs/tasks/ should be public-facing
- [ ] Consider how to word technical tasks for general audience
- [ ] Evaluate auto-sync vs manual curation approach

## Open Questions

- Should the roadmap be static markdown or dynamic from task docs?
- Should users be able to vote/request features?
- How much detail to show (full implementation plans vs high-level features)?
- Should it show estimated timelines or just "planned/in-progress/done"?
- Where should the roadmap link appear (footer, about page, dedicated page)?

## Proposed Approach

_To be filled after research._

### Display Options

1. **Static page** - Manually curated `/roadmap` page with planned features
2. **Generated from task docs** - Build script that extracts task summaries
3. **External service** - Use GitHub Projects or similar (links out)

### Content Strategy

Public-friendly descriptions of:

- Phase 1: Quick wins (SEO, sharing, saved preferences)
- Phase 2: Congress data (voting records, bill tracking)
- Phase 3: Enhanced features (campaign finance, interactive maps)

## Implementation Tasks

_To be filled after research._

### Page Creation

- [ ] Create `src/pages/roadmap.astro` page
- [ ] Design roadmap layout (phases, status indicators)
- [ ] Write public-friendly descriptions for each feature
- [ ] Add "suggest a feature" link (GitHub Discussions or email)

### Navigation

- [ ] Add roadmap link to footer
- [ ] Consider adding to main navigation or about page

### Content Management

- [ ] Decide: manual updates vs auto-generation
- [ ] If auto-generated: create build script to extract from task docs
- [ ] If manual: document update process

### Styling

- [ ] Phase/status indicators with civic color scheme
- [ ] Mobile-responsive layout
- [ ] Consistent with site design language

## Example Roadmap Content

```markdown
# Roadmap

## Now Building

- **Bill Tracking** - See what legislation your representatives sponsor

## Up Next

- **Voting Records** - View how your reps voted on key bills
- **Share Buttons** - Easily share templates on social media

## Planned

- **Campaign Finance** - See who funds your representatives
- **Interactive District Map** - Find your district visually

## Completed

- **Letter Templates** - Community-contributed letter templates
- **ZIP Code Lookup** - Find your representatives by ZIP
```

## Verification

- [ ] Roadmap page accessible at `/roadmap`
- [ ] All planned features accurately described
- [ ] Status indicators reflect current progress
- [ ] Mobile-responsive design
- [ ] Link visible in footer/navigation
- [ ] Content is understandable to non-technical users
