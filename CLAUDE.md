# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
make dev                    # Start Mailpit + Astro dev (localhost:4321, Mailpit at :8025)
pnpm dev                    # Astro dev server only

# Testing
pnpm test                   # Run unit tests (Vitest)
pnpm test:watch             # Watch mode
pnpm test -- src/lib/foo    # Run specific test file
pnpm test:e2e               # Playwright E2E tests

# Code quality
pnpm lint && pnpm format:check && pnpm typecheck  # Full check (runs in CI)

# Database
pnpm db:push                # Push schema to Neon
pnpm db:studio              # Drizzle Studio GUI
make db-seed                # Import legislators + ZIP data
```

## Architecture

### Astro + React Islands

Server-rendered Astro pages with React components hydrated via `client:load`. API routes in `src/pages/api/` require `export const prerender = false;`.

### Database (Neon + Drizzle)

- Uses Neon serverless Postgres via HTTP driver (`@neondatabase/serverless`)
- Schema in `src/db/schema.ts`, queries in `src/db/queries/`
- **No global caching** - create fresh connection per request: `createDb(import.meta.env.DATABASE_URL)`

### Authentication

Passwordless OTP flow with timing-safe verification:

1. `request-otp`: Hashes email (SHA-256), stores hashed OTP
2. `verify-otp`: Queries by both emailHash AND otpHash (timing-safe comparison in DB)
3. Session cookie: `sameSite: "strict"`, 30-day expiry

**Email addresses are never stored** - only SHA-256 hashes. Middleware validates sessions via single JOIN query.

### Email Providers

Abstraction in `src/lib/email/` supports SMTP (Mailpit locally) and SES. Config via `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`.

### ZIP Code Lookup

Client-side lookup against `public/data/zip-districts.json`. Server never sees user's ZIP code.

### URL Sanitization

External URLs (e.g., `contactFormUrl`) sanitized via `src/lib/url.ts` - only `.gov` domains allowed.

## Key Patterns

- **Imports**: Use `@/` alias for `src/` paths
- **API routes**: Always add `export const prerender = false;`
- **Database**: Fresh connection per request, prefer JOINs over multiple queries
- **Tests**: Unit tests colocated as `*.test.ts`, E2E in `tests/e2e/`

## GitHub & CI

- **Org name**: `anomalousventures` (no hyphen)
- **PR comments**: `gh api repos/anomalousventures/democracy-direct/pulls/{pr}/comments/{id}/replies -f body="..."`
- **CI lint job**: Runs both `eslint` and `prettier --check` - Prettier failures show as lint failures
- **Pre-commit**: lint-staged auto-formats; commits include typecheck
