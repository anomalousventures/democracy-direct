# Production Smoke Tests

## Status: Ready

## Problem Statement

Configuration errors (like wrong Turnstile keys) can slip into production and break critical functionality. We need automated smoke tests that run after each production deploy to catch issues early and notify the team via Discord.

## Research Completed

- [x] Investigate `deployment_status` GitHub Action trigger for Cloudflare Pages
  - Cloudflare Pages native GitHub integration doesn't reliably create `deployment_status` events
  - **Use `check_run` event instead** - fires when Cloudflare completes a build
  - Filter for `github.event.check_run.app.slug == 'cloudflare-workers-and-pages'`
  - Existing `accessibility.yml` already uses this pattern successfully
- [x] Evaluate running Playwright against production vs simple fetch tests
  - **Recommendation: Simple fetch tests for smoke testing**
  - Playwright is heavier, better suited for E2E (already runs in CI)
  - Fetch tests are fast, lightweight, and sufficient for health checks
  - Can test API endpoints, page loads, and basic responses
- [x] Research Discord webhook setup and message formatting
  - Discord webhooks accept JSON with `content` and optional `embeds`
  - Use `tsickert/discord-webhook` GitHub Action for easy integration
  - Or use raw `curl` for more control over formatting
  - Embeds support: title, description, color, fields, timestamp
- [x] Determine which endpoints/pages are critical to test
  - `/api/health` - DB connectivity (already returns status)
  - Homepage - Basic page load
  - `/templates` - Key functionality
  - `/api/auth/request-otp` - Auth endpoint responds (not 500)
  - Turnstile script loads (check for script tag in HTML)
- [x] Research Cloudflare Pages rollback API
  - `POST /accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}/rollback`
  - Requires: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Pages Write permission)
  - Can only rollback to successful production builds
  - **Recommendation: Manual rollback link in Discord, not auto-rollback**

## Open Questions - Resolved

| Question                   | Decision                    | Rationale                                                    |
| -------------------------- | --------------------------- | ------------------------------------------------------------ |
| Block deploy or notify?    | **Notify only**             | Can't block Cloudflare's native deploy, just run tests after |
| How often to run?          | **Every production deploy** | Catch issues immediately                                     |
| Minimum test set?          | **5 tests**                 | Health, homepage, templates, auth endpoint, Turnstile script |
| Dedicated Discord channel? | **Yes, #alerts**            | Keep noise out of main channels                              |
| Handle flaky tests?        | **Single retry**            | Avoid alert fatigue from transient failures                  |
| Auto-rollback?             | **No, manual link**         | Auto-rollback is risky; provide easy manual option           |
| Production vs preview?     | **Production only**         | Preview gets tested by accessibility workflow                |

## Proposed Approach

1. Create smoke test workflow triggered by Cloudflare check_run completion
2. Filter for production deployments only (main branch)
3. Run lightweight fetch-based tests against production URL
4. Send Discord notification only on failure
5. Include manual rollback link in failure notification

## Implementation Tasks

### Discord Setup

1. Create `#alerts` channel in Discord server
2. Create webhook in channel settings (Edit Channel → Integrations → Webhooks)
3. Copy webhook URL
4. Add `DISCORD_WEBHOOK_URL` to GitHub repository secrets

### Cloudflare API Setup (for rollback links)

5. Get Cloudflare Account ID from dashboard URL or API
6. Create API token with "Pages Write" permission
7. Add `CLOUDFLARE_ACCOUNT_ID` to GitHub secrets
8. Add `CLOUDFLARE_API_TOKEN` to GitHub secrets

### Workflow Creation

9. Create `.github/workflows/smoke-test.yml` with:
   - Trigger on `check_run` completed for Cloudflare
   - Filter for main branch (production) only
   - Run smoke tests
   - Send Discord notification on failure

### Smoke Test Script

10. Create `scripts/smoke-test.sh` (or inline in workflow) that tests:
    - `GET /api/health` returns 200 with `status: "ok"`
    - `GET /` returns 200 and contains expected content
    - `GET /templates` returns 200
    - `GET /api/auth/request-otp` returns 400 (missing body, not 500)
    - Homepage HTML contains Turnstile script tag
11. Return non-zero exit code on any failure
12. Collect failure details for Discord message

### Notification Formatting

13. Format Discord embed with:
    - Red color for failures (#FF0000)
    - List of failed tests
    - Link to GitHub Action run
    - Link to production site
    - Link to Cloudflare dashboard for manual rollback
    - Timestamp

## Workflow File

```yaml
name: Production Smoke Tests

on:
  check_run:
    types: [completed]

permissions:
  contents: read

jobs:
  smoke-test:
    name: Smoke Test Production
    runs-on: ubuntu-latest
    if: |
      github.event.check_run.app.slug == 'cloudflare-workers-and-pages' &&
      github.event.check_run.conclusion == 'success' &&
      github.event.check_run.head_branch == 'main'

    steps:
      - name: Wait for deployment propagation
        run: sleep 30

      - name: Run smoke tests
        id: smoke
        env:
          PROD_URL: https://democracy-direct.com
        run: |
          FAILURES=""

          # Test 1: Health endpoint
          HEALTH=$(curl -sf "$PROD_URL/api/health" || echo "FAIL")
          if [[ "$HEALTH" == "FAIL" ]] || ! echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null; then
            FAILURES="${FAILURES}- /api/health failed\n"
          fi

          # Test 2: Homepage loads
          if ! curl -sf "$PROD_URL" > /dev/null; then
            FAILURES="${FAILURES}- Homepage failed to load\n"
          fi

          # Test 3: Templates page
          if ! curl -sf "$PROD_URL/templates" > /dev/null; then
            FAILURES="${FAILURES}- /templates failed to load\n"
          fi

          # Test 4: Auth endpoint responds (400 expected, not 500)
          AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/auth/request-otp")
          if [[ "$AUTH_STATUS" == "500" ]] || [[ "$AUTH_STATUS" == "000" ]]; then
            FAILURES="${FAILURES}- /api/auth/request-otp returned $AUTH_STATUS\n"
          fi

          # Test 5: Turnstile script present
          if ! curl -sf "$PROD_URL" | grep -q "challenges.cloudflare.com/turnstile"; then
            FAILURES="${FAILURES}- Turnstile script not found\n"
          fi

          if [[ -n "$FAILURES" ]]; then
            echo "failures<<EOF" >> $GITHUB_OUTPUT
            echo -e "$FAILURES" >> $GITHUB_OUTPUT
            echo "EOF" >> $GITHUB_OUTPUT
            exit 1
          fi

          echo "All smoke tests passed!"

      - name: Send Discord notification on failure
        if: failure()
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: |
          FAILURES="${{ steps.smoke.outputs.failures }}"
          TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

          curl -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"🚨 Production Smoke Test Failed\",
                \"color\": 16711680,
                \"fields\": [
                  {
                    \"name\": \"Failed Tests\",
                    \"value\": \"$FAILURES\"
                  },
                  {
                    \"name\": \"Links\",
                    \"value\": \"[GitHub Action](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}) | [Production Site](https://democracy-direct.com) | [Cloudflare Dashboard](https://dash.cloudflare.com)\"
                  }
                ],
                \"timestamp\": \"$TIMESTAMP\"
              }]
            }" \
            "$DISCORD_WEBHOOK"
```

## Discord Notification Format

### On Failure

```
🚨 Production Smoke Test Failed

Failed Tests:
- /api/health failed
- Turnstile script not found

Links:
[GitHub Action](link) | [Production Site](https://democracy-direct.com) | [Cloudflare Dashboard](link)

Timestamp: 2025-01-29T14:30:00Z
```

### On Success

No notification (avoid noise)

## Manual Rollback Process

If smoke tests fail:

1. Click "Cloudflare Dashboard" link in Discord notification
2. Navigate to Pages → democracy-direct → Deployments
3. Find last working deployment
4. Click "..." menu → "Rollback to this deployment"

Or via API (for automation later):

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/democracy-direct/deployments/$DEPLOYMENT_ID/rollback" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

## Verification

- [ ] Workflow triggers only for production (main branch) deployments
- [ ] Workflow does NOT trigger for preview deployments
- [ ] All 5 smoke tests execute correctly
- [ ] Failed tests are properly detected
- [ ] Discord notification sent on failure with correct format
- [ ] Discord notification NOT sent on success
- [ ] Links in notification work (GitHub Action, production site)
- [ ] Tests complete within 2 minutes
- [ ] Retry logic prevents alert fatigue from transient failures
- [ ] `DISCORD_WEBHOOK_URL` secret is configured
- [ ] Manual rollback process documented and tested
