# Task Backlog

Index of feature development tasks for Democracy Direct. Each document contains research, exploration, and implementation tasks that can be handed off to ralph loops.

## Status Legend

- **Research** - Investigation and planning phase
- **Ready** - Researched and ready for implementation
- **In Progress** - Currently being implemented
- **Complete** - Implemented and verified

## Tasks

| Task                                                        | Status   | Description                                     |
| ----------------------------------------------------------- | -------- | ----------------------------------------------- |
| [Prod Smoke Tests](./prod-smoke-tests.md)                   | Ready    | Post-deploy smoke tests + Discord alerts        |
| [Data Refresh Optimization](./data-refresh-optimization.md) | Ready    | Optimize import scripts + Discord notifications |
| [Public Roadmap](./public-roadmap.md)                       | Ready    | Public-facing feature roadmap page              |
| [Saved District](./saved-district.md)                       | Ready    | Save district to user profile                   |
| [SEO & Social Sharing](./seo-social.md)                     | Ready    | Optimize meta tags and social sharing           |
| [Share Buttons](./share-buttons.md)                         | Ready    | Add share functionality to pages                |
| [Voting Records](./voting-records.md)                       | Ready    | Integrate voting records (House + Senate)       |
| [Bill Summaries](./bill-summaries.md)                       | Ready    | Bill tracking and summaries                     |
| [Lighthouse Optimization](./lighthouse-optimization.md)     | Ready    | Performance, a11y, SEO optimization             |
| [Legislation Search](./legislation-search.md)               | Ready    | Search bills, find who voted how                |
| [Template Bill Linking](./template-bill-linking.md)         | Ready    | Link templates to specific bills                |
| [Rep Page Editor](./rep-editor.md)                          | Research | Streamline editor/preview/print flow            |
| [Campaign Finance](./campaign-finance.md)                   | Ready    | ProPublica Campaign Finance API integration     |
| [District Map](./district-map.md)                           | Ready    | Map-based district picker via TIGERweb          |

## Suggested Implementation Order

### Phase 0: Infrastructure

1. **Prod Smoke Tests** - Catch issues early, Discord alerts
2. **Data Refresh Optimization** - Reduce DB churn, Discord notifications
3. **Public Roadmap** - Show users what's coming

### Phase 1: Quick Wins

1. **SEO & Social Sharing** - Simple meta tag updates
2. **Share Buttons** - Standalone component, no backend
3. **Saved District** - Schema exists, clear scope

### Phase 2: Congress Data

1. **Voting Records** - House + Senate roll call votes
2. **Bill Summaries** - Builds on Congress API work
3. **Legislation Search** - Depends on voting records + bills
4. **Template Bill Linking** - Connects templates to legislation

### Phase 3: Polish & Enhancement

1. **Lighthouse Optimization** - Audit and improve (partially implemented)
2. **Rep Page Editor** - UX improvements
3. **Campaign Finance** - ProPublica Campaign Finance API
4. **District Map** - MapLibre + TIGERweb integration

## External API Summary

| API          | Tasks Using It                 | Rate Limit | Status                                 |
| ------------ | ------------------------------ | ---------- | -------------------------------------- |
| Congress.gov | Voting Records, Bill Summaries | 5,000/hour | Active (`CONGRESS_API_KEY` configured) |
| ProPublica   | Campaign Finance               | 5,000/day  | Active (key via email request)         |
| TIGERweb     | District Map                   | None       | Active (no key needed)                 |

## How to Use

**For tasks in "Ready" status:**

1. Pick a task from the table above
2. Read the full task document
3. Follow implementation tasks in order
4. Run verification checklist
5. Update status to "Complete" when done

**For tasks in "Research" status:**

1. Complete research tasks to gather information
2. Answer open questions and propose an approach
3. Fill in implementation tasks
4. Update status to "Ready"
