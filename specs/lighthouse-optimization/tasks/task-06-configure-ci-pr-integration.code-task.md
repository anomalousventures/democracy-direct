---
status: completed
created: 2026-02-11
started: 2026-02-11
completed: 2026-02-11
---

# Task: Configure Lighthouse CI PR Comments and Status Checks

## Description

Configure Lighthouse CI to post score summaries as PR comments and add it as a required status check to prevent score regressions from merging.

## Background

Lighthouse CI can upload results to a temporary public storage or GitHub status API, and post formatted comments on PRs showing score comparisons. Making Lighthouse CI a required status check prevents PRs from merging if scores drop below the 90 threshold.

## Reference Documentation

**Required:**

- Design: docs/tasks/lighthouse-optimization.md

## Technical Requirements

1. Configure Lighthouse CI to post score results as a PR comment
2. Use GitHub Actions token or LHCI GitHub app for PR comment permissions
3. Add Lighthouse CI as a required status check for the `main` branch
4. Score summary should show all four categories for each audited page
5. Comments should show comparison to previous scores when available

## Dependencies

- task-05 (Lighthouse CI workflow exists and runs)

## Implementation Approach

1. Update `lighthouserc.js` to configure the upload target:
   - Use `target: 'temporary-public-storage'` for simplest setup (no server needed)
   - Or configure GitHub status checks via `ci.upload.target: 'lhci'` with GitHub App
2. Add `LHCI_GITHUB_APP_TOKEN` to repository secrets if using the LHCI GitHub App
3. Ensure the workflow has `pull-requests: write` permission for commenting
4. In GitHub repo settings, add the Lighthouse CI check as a required status check under branch protection rules for `main`
5. Open a test PR to verify comments appear and status check shows

## Acceptance Criteria

1. **PR comments show scores**
   - Given a PR triggers the Lighthouse CI workflow
   - When the workflow completes
   - Then a comment appears on the PR showing Lighthouse scores for all pages

2. **Status check appears**
   - Given a PR triggers the Lighthouse CI workflow
   - When the PR checks list is viewed
   - Then a Lighthouse CI status check is visible

3. **Merge blocked on failure**
   - Given Lighthouse CI is a required status check
   - When any page scores below 90 in any category
   - Then the PR cannot be merged

4. **Comment format is readable**
   - Given the PR comment is posted
   - When a reviewer reads it
   - Then scores are clearly formatted with page names and all four categories

## Manual Step Required

Adding "Lighthouse Audit" as a required status check requires a manual change in GitHub repo settings:

1. Go to Settings → Branches → Branch protection rules for `main`
2. Under "Require status checks to pass before merging", add "Lighthouse Audit"

This cannot be automated via code and must be done by a repo admin after the workflow has run at least once (GitHub only shows status checks that have previously reported).

## Metadata

- **Complexity**: Low
- **Labels**: ci, github-actions, developer-experience
- **Required Skills**: GitHub Actions, branch protection, Lighthouse CI
