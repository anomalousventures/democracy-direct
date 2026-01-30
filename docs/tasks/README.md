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
| [Prod Smoke Tests](./prod-smoke-tests.md)                   | Research | Post-deploy smoke tests + Discord alerts        |
| [Data Refresh Optimization](./data-refresh-optimization.md) | Research | Optimize import scripts + Discord notifications |
| [Saved District](./saved-district.md)                       | Ready    | Save district to user profile                   |
| [SEO & Social Sharing](./seo-social.md)                     | Ready    | Optimize meta tags and social sharing           |
| [Share Buttons](./share-buttons.md)                         | Ready    | Add share functionality to pages                |
| [Voting Records](./voting-records.md)                       | Ready    | Integrate Congress voting records               |
| [Bill Summaries](./bill-summaries.md)                       | Ready    | Bill tracking and summaries                     |
| [Lighthouse Optimization](./lighthouse-optimization.md)     | Ready    | Performance, a11y, SEO optimization             |
| [Legislation Search](./legislation-search.md)               | Research | Search bills, find who voted how                |
| [Template Bill Linking](./template-bill-linking.md)         | Research | Link templates to specific bills                |
| [Rep Page Editor](./rep-editor.md)                          | Research | Streamline editor/preview/print flow            |
| [Campaign Finance](./campaign-finance.md)                   | Research | FEC/OpenSecrets data integration                |
| [District Map](./district-map.md)                           | Research | Map-based district picker                       |

## Suggested Implementation Order

### Phase 0: Infrastructure

1. **Prod Smoke Tests** - Catch issues early, Discord alerts
2. **Data Refresh Optimization** - Reduce DB churn, Discord notifications

### Phase 1: Quick Wins

2. **SEO & Social Sharing** - Simple meta tag updates
3. **Share Buttons** - Standalone component, no backend
4. **Saved District** - Schema exists, clear scope

### Phase 2: Congress Data

5. **Voting Records** - Foundation for legislation features
6. **Bill Summaries** - Builds on Congress API work
7. **Legislation Search** - Depends on voting records + bills
8. **Template Bill Linking** - Connects templates to legislation

### Phase 3: Polish & Enhancement

9. **Lighthouse Optimization** - Audit and improve
10. **Rep Page Editor** - UX improvements
11. **Campaign Finance** - New external API integration
12. **District Map** - Complex frontend, new dependencies

## How to Use

1. Pick a task in "Ready" status
2. Read the full task document
3. Follow implementation tasks in order
4. Run verification checklist
5. Update status to "Complete" when done

For tasks in "Research" status:

1. Complete research tasks to gather information
2. Answer open questions and propose an approach
3. Fill in implementation tasks
4. Update status to "Ready"
