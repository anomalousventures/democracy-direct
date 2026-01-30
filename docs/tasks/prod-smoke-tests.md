# Production Smoke Tests

## Problem Statement

Configuration errors (like wrong Turnstile keys) can slip into production and break critical functionality. We need automated smoke tests that run after each production deploy to catch issues early and notify the team via Discord.

## Research Needed

- [ ] Investigate `deployment_status` GitHub Action trigger for Cloudflare Pages
- [ ] Evaluate running Playwright against production vs simple fetch tests
- [ ] Research Discord webhook setup and message formatting
- [ ] Determine which endpoints/pages are critical to test
- [ ] Consider rate limiting implications of automated testing

## Open Questions

- Should smoke tests block deploy or just notify on failure?
- How often should tests run? (every deploy, scheduled, both?)
- What's the minimum set of tests that catch most issues?
- Should we create a dedicated Discord channel for alerts?
- How to handle flaky tests (retry logic)?
- Should we auto-rollback on failure using Cloudflare API, or just notify?
- What's the threshold for auto-rollback vs manual intervention?

## Proposed Approach

_To be filled after research._

## Implementation Tasks

_To be filled after research._

### GitHub Action Workflow

- [ ] Create `.github/workflows/smoke-test.yml`
- [ ] Trigger on `deployment_status` for production
- [ ] Run subset of Playwright tests against live URL
- [ ] Send Discord notification on failure

### Tests to Include

- [ ] Homepage loads (200 status)
- [ ] Turnstile script loads and initializes
- [ ] `/api/auth/request-otp` responds (not 500)
- [ ] `/api/health` returns healthy status
- [ ] Key pages render: `/about`, `/privacy`, `/templates`
- [ ] ZIP lookup works (test with known ZIP)
- [ ] Rep page loads (test with known bioguide ID)

### Discord Integration

- [ ] Create Discord webhook in server settings
- [ ] Store webhook URL as GitHub secret
- [ ] Format failure messages with:
  - Which tests failed
  - Link to GitHub Action run
  - Link to production site
  - Timestamp

### Rollback (Optional)

- [ ] Research Cloudflare Pages API for deployments
- [ ] Store Cloudflare API token as GitHub secret
- [ ] Implement auto-rollback on critical failures
- [ ] Or include manual rollback link in Discord message

### Notification Format

```
🚨 Production Smoke Test Failed

**Failed tests:**
- Turnstile widget not loading
- /api/health returned 500

**Links:**
- [GitHub Action Run](link)
- [Production Site](https://democracy-direct.com)

**Time:** 2024-01-29 14:30 UTC
```

## Verification

- [ ] Workflow triggers on production deploy
- [ ] Tests run against correct production URL
- [ ] Discord notification sent on failure
- [ ] Discord notification NOT sent on success (avoid noise)
- [ ] Failed workflow visible in GitHub Actions
- [ ] Tests complete in reasonable time (<2 min)
