---
status: completed
created: 2026-02-11
started: 2026-02-11
completed: 2026-02-12
---

# Task: Add Lighthouse CI to GitHub Actions

## Description

Set up Lighthouse CI as an automated PR check that runs against all five key pages, blocking merges if any score drops below 90.

## Background

The project uses GitHub Actions for CI (`.github/workflows/ci.yml` runs lint, typecheck, tests). Lighthouse CI (`@lhci/cli`) is the official tool for automated Lighthouse auditing in CI pipelines. It can build the site, serve it locally, run audits, and assert score thresholds.

## Reference Documentation

**Required:**

- Design: docs/tasks/lighthouse-optimization.md

## Technical Requirements

1. Install `@lhci/cli` as a devDependency
2. Create `lighthouserc.js` configuration file at project root
3. Configure URL list for all five key pages
4. Set score assertions at 90 for all four categories
5. Create `.github/workflows/lighthouse.yml` workflow triggered on `pull_request` events
6. Workflow must build the site before running Lighthouse CI

## Dependencies

- task-04 (scores verified at 90+) must be complete so CI doesn't immediately fail

## Implementation Approach

1. Install: `pnpm add -D @lhci/cli`
2. Create `lighthouserc.js`:
   - `ci.collect.url` array with all five page paths
   - `ci.collect.startServerCommand` to serve the built site
   - `ci.assert.assertions` with `performance >= 90`, `accessibility >= 90`, `best-practices >= 90`, `seo >= 90`
3. Create `.github/workflows/lighthouse.yml`:
   - Trigger on `pull_request`
   - Checkout, setup Node + pnpm, install deps
   - Run `pnpm build` to produce static + server output
   - Run `npx @lhci/cli autorun` (or `lhci autorun`)
4. Test locally with `npx @lhci/cli autorun` to verify configuration

## Acceptance Criteria

1. **@lhci/cli installed**
   - Given the project's package.json
   - When devDependencies are inspected
   - Then `@lhci/cli` is listed

2. **lighthouserc.js configured**
   - Given the config file exists at project root
   - When its contents are reviewed
   - Then it includes URLs for all five key pages and score assertions at 90

3. **Workflow triggers on PRs**
   - Given `.github/workflows/lighthouse.yml` exists
   - When a PR is opened or updated
   - Then the Lighthouse CI workflow is triggered

4. **Workflow builds before auditing**
   - Given the workflow runs
   - When the steps are inspected
   - Then `pnpm build` runs before `lhci autorun`

5. **Score thresholds enforced**
   - Given the Lighthouse CI configuration
   - When assertions are inspected
   - Then all four categories require a minimum score of 90

6. **Local validation passes**
   - Given the configuration is complete
   - When `npx @lhci/cli autorun` is run locally
   - Then all audits pass the 90 threshold

## Metadata

- **Complexity**: Medium
- **Labels**: ci, performance, github-actions
- **Required Skills**: GitHub Actions, Lighthouse CI, Node.js
