# Public Roadmap

## Status: In Progress

## Problem Statement

Users visiting the site may want to know what features are planned. A public roadmap builds trust, sets expectations, and encourages community engagement. It also provides transparency about the project's direction and allows users to see that the project is actively developed.

## Research Completed

- [x] Review roadmap implementations on similar civic/open-source projects
  - Most civic tech projects use simple list-based roadmaps
  - CalMatters, OpenSecrets use phase-based groupings
  - Simplicity and clarity more important than fancy visualizations
- [x] Evaluate roadmap display formats (timeline, kanban, list)
  - **Recommendation: Phased list** - matches existing about.astro structure
  - Timeline requires dates (project avoids time estimates)
  - Kanban is overkill for ~15 features
- [x] Determine which tasks from docs/tasks/ should be public-facing
  - All user-facing features (voting records, campaign finance, etc.)
  - Exclude infrastructure tasks (smoke tests, data refresh optimization)
  - Exclude internal tooling
- [x] Consider how to word technical tasks for general audience
  - Focus on user benefit, not implementation
  - "See how your reps voted" not "Integrate Congress.gov API"
  - One sentence per feature
- [x] Evaluate auto-sync vs manual curation approach
  - **Recommendation: Manual curation**
  - Task docs contain technical details not suitable for public
  - Updates infrequent (only when features ship)
  - Public-facing descriptions need editorial control

## Open Questions - Resolved

| Question            | Decision                  | Rationale                                        |
| ------------------- | ------------------------- | ------------------------------------------------ |
| Static or dynamic?  | **Static page**           | Simpler, manual curation needed anyway           |
| Feature voting?     | **No, link to GitHub**    | Adds complexity; GitHub Discussions for feedback |
| How much detail?    | **One-liner per feature** | Public wants overview, not implementation plans  |
| Timeline estimates? | **No, just status**       | Project avoids time estimates per guidelines     |
| Where to link?      | **Footer + About page**   | Not prominent enough for main nav                |

## Proposed Approach

1. Create static `/roadmap` page following about.astro patterns
2. Group features by phase (Now Building, Up Next, Planned, Completed)
3. Write user-friendly one-liner for each feature
4. Link to GitHub Discussions for feature suggestions
5. Add link in footer and mention on about page

## Implementation Tasks

### Page Creation

1. Create `src/pages/roadmap.astro` using Layout component (same pattern as about.astro)
2. Use semantic sections with phase headings:
   - "Now Building" (in-progress features)
   - "Up Next" (ready for implementation)
   - "Planned" (researched but not started)
   - "Completed" (shipped features)
3. Write user-friendly one-liner for each feature (see Content section below)
4. Add status indicators using civic colors:
   - In Progress: blue badge
   - Ready: green badge
   - Planned: gray badge
   - Complete: checkmark

### Navigation Updates

5. Add "Roadmap" link to footer in `src/components/Footer.astro`
6. Add brief mention + link in about.astro ("See our roadmap for planned features")

### Feature Suggestions

7. Enable GitHub Discussions on repository (Settings → Features → Discussions)
8. Create "Feature Requests" discussion category
9. Add "Suggest a feature" link at bottom of roadmap page pointing to Discussions

### SEO

10. Add meta title: "Roadmap | Democracy Direct"
11. Add meta description: "See what features we're building to help you engage with your representatives"

## Roadmap Content

### Completed Features

| Feature          | Public Description                                              |
| ---------------- | --------------------------------------------------------------- |
| ZIP Code Lookup  | Find your representatives instantly by entering your ZIP code   |
| Letter Templates | Browse community-contributed templates for contacting your reps |
| Rep Profiles     | View contact info and social media for all members of Congress  |
| Accessibility    | Screen reader support, keyboard navigation, and high contrast   |

### Now Building (In Progress)

_None currently - use this section when actively working on a feature_

### Up Next (Ready for Implementation)

| Feature        | Public Description                                               | Task Doc          |
| -------------- | ---------------------------------------------------------------- | ----------------- |
| Share Buttons  | Share templates easily on social media                           | share-buttons.md  |
| Save District  | Remember your district so you don't have to look it up each time | saved-district.md |
| Voting Records | See how your representatives voted on key legislation            | voting-records.md |
| Bill Summaries | Track bills your representatives sponsor and co-sponsor          | bill-summaries.md |

### Planned (Researched)

| Feature          | Public Description                                | Task Doc            |
| ---------------- | ------------------------------------------------- | ------------------- |
| Campaign Finance | See who funds your representatives' campaigns     | campaign-finance.md |
| District Map     | Find your district visually on an interactive map | district-map.md     |

### Infrastructure (Not on Public Roadmap)

These tasks improve reliability but aren't user-facing features:

- Prod Smoke Tests (prod-smoke-tests.md)
- Data Refresh Optimization (data-refresh-optimization.md)

## Verification

- [ ] Roadmap page accessible at `/roadmap`
- [ ] Page uses Layout component with proper meta tags
- [ ] Features grouped by status (Now Building, Up Next, Planned, Completed)
- [ ] Each feature has user-friendly one-liner description
- [ ] Status badges use consistent civic color scheme
- [ ] Mobile-responsive layout (test on mobile viewport)
- [ ] Footer contains "Roadmap" link
- [ ] About page mentions roadmap with link
- [ ] GitHub Discussions enabled with "Feature Requests" category
- [ ] "Suggest a feature" link works and goes to Discussions
- [ ] Content is understandable to non-technical users
- [ ] No time estimates or dates shown
