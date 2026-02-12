---
status: pending
created: 2026-02-11
started: null
completed: null
---

# Task: Request ProPublica API Key and Configure Environment

## Description

Request a ProPublica Campaign Finance API key, configure it in the local development environment, and add it as a GitHub repository secret for CI/workflow access.

## Background

The ProPublica Campaign Finance API requires an API key obtained by emailing apihelp@propublica.org. The key is passed via `X-API-Key` header. This is a manual step that may take 1-2 business days for the API key to be issued. The key needs to be available locally (in `.dev.vars` which is symlinked as `.env`) and in GitHub Actions for the daily data sync workflow.

## Reference Documentation

**Required:**

- Design: docs/tasks/campaign-finance.md (API Integration section)

## Technical Requirements

1. Email apihelp@propublica.org to request a Campaign Finance API key
2. Once received, verify the key works by making a test request to the API
3. Add `PROPUBLICA_CAMPAIGN_FINANCE_KEY` to `.dev.vars` for local development
4. Add `PROPUBLICA_CAMPAIGN_FINANCE_KEY` as a GitHub repository secret
5. Add the environment variable to the Astro env schema if one exists, or document it

## Dependencies

- None (can be done in parallel with schema work)

## Implementation Approach

1. Send email to apihelp@propublica.org requesting a Campaign Finance API key
2. Once key is received, test with curl:
   ```
   curl -H "X-API-Key: YOUR_KEY" \
     "https://api.propublica.org/campaign-finance/v1/2024/candidates/S4VT00033.json"
   ```
3. Add to `.dev.vars`: `PROPUBLICA_CAMPAIGN_FINANCE_KEY=<key>`
4. Add to GitHub secrets via: Settings > Secrets and variables > Actions > New repository secret
5. Verify the key is accessible in a test script or via `import.meta.env.PROPUBLICA_CAMPAIGN_FINANCE_KEY`

## Acceptance Criteria

1. **API key requested**
   - Given the need for ProPublica API access
   - When the request email is sent
   - Then confirmation of the request is documented

2. **API key verified working**
   - Given the API key has been received
   - When a test request is made to the candidate endpoint
   - Then a valid JSON response is returned with campaign finance data

3. **Local environment configured**
   - Given `.dev.vars` is updated
   - When the dev server reads environment variables
   - Then `PROPUBLICA_CAMPAIGN_FINANCE_KEY` is available

4. **GitHub secret configured**
   - Given the repository secrets are updated
   - When a GitHub Actions workflow references the secret
   - Then `secrets.PROPUBLICA_CAMPAIGN_FINANCE_KEY` is available

## Metadata

- **Complexity**: Low
- **Labels**: configuration, api-key, manual, campaign-finance
- **Required Skills**: API testing, GitHub administration
