---
status: completed
created: 2026-02-11
started: 2026-02-13
completed: 2026-02-13
---

# Task: Add Campaign Finance Sync to Refresh Data Workflow

## Description

Add the campaign finance sync as a step in the existing `.github/workflows/refresh-data.yml` GitHub Action so data syncs daily alongside legislators, ZIP codes, templates, votes, and bills.

## Background

The refresh-data workflow runs daily at 6am UTC and currently syncs legislators, ZIP districts, templates, voting records, and bills. Each step captures output for Discord notifications and uses a consistent error-handling pattern. The campaign finance sync should run AFTER the legislator import (since it depends on FEC IDs being populated) and follow the same output capture and error reporting pattern.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (Sync Strategy section)

**Additional References:**

- Existing workflow: .github/workflows/refresh-data.yml

## Technical Requirements

1. Add a "Sync campaign finance" step after the "Import legislators" step
2. Pass `PROPUBLICA_CAMPAIGN_FINANCE_KEY` secret to the step
3. Pass `DATABASE_URL` (prod) to the step
4. Follow the existing error-handling pattern (capture output, set failed flag)
5. Include the step in the Discord notification summary
6. Include the step in the final "Fail workflow if imports failed" check

## Dependencies

- task-06 (sync:finance npm script exists)

## Implementation Approach

1. Read `.github/workflows/refresh-data.yml` to understand the existing pattern
2. Add a new step after "Import legislators" (and before "Import ZIP districts" or after it):
   ```yaml
   - name: Sync campaign finance
     id: finance
     run: |
       set +e
       OUTPUT=$(pnpm sync:finance 2>&1)
       EXIT_CODE=$?
       set -e
       echo "$OUTPUT"
       JSON=$(echo "$OUTPUT" | grep -E '^\{' | head -1 || echo '{}')
       echo "result=$JSON" >> $GITHUB_OUTPUT
       if [ $EXIT_CODE -ne 0 ]; then
         echo "failed=true" >> $GITHUB_OUTPUT
       else
         echo "failed=false" >> $GITHUB_OUTPUT
       fi
     env:
       DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
       PROPUBLICA_CAMPAIGN_FINANCE_KEY: ${{ secrets.PROPUBLICA_CAMPAIGN_FINANCE_KEY }}
   ```
3. Add finance status to the Discord notification section:
   - Parse results (changed, count)
   - Add `FINANCE_FAILED` to the overall failure check
   - Add finance status line to the notification description
4. Add `steps.finance.outputs.failed == 'true'` to the final failure check condition

## Acceptance Criteria

1. **Step added to workflow**
   - Given `.github/workflows/refresh-data.yml`
   - When the workflow steps are reviewed
   - Then a "Sync campaign finance" step exists

2. **Runs after legislator import**
   - Given the step ordering in the workflow
   - When the finance sync step is reviewed
   - Then it appears after the "Import legislators" step

3. **Secrets passed correctly**
   - Given the finance sync step
   - When its env configuration is reviewed
   - Then both `DATABASE_URL` and `PROPUBLICA_CAMPAIGN_FINANCE_KEY` are provided from secrets

4. **Error handling follows pattern**
   - Given the finance sync step
   - When its script is reviewed
   - Then it captures output, sets exit code, and writes `failed` output matching the existing pattern

5. **Discord notification includes finance**
   - Given the notification section
   - When finance-related variables are reviewed
   - Then finance sync status appears in the notification message

6. **Failure check includes finance**
   - Given the "Fail workflow if imports failed" step
   - When its condition is reviewed
   - Then `steps.finance.outputs.failed == 'true'` is included

## Metadata

- **Complexity**: Medium
- **Labels**: ci, github-actions, campaign-finance, data-sync
- **Required Skills**: GitHub Actions, YAML, shell scripting
