# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
make dev                    # Start Mailpit + dev server with hot reload (localhost:4321)
pnpm dev                    # Dev server with hot reload (platformProxy for Cloudflare bindings)
pnpm dev:wrangler           # Build + wrangler dev (fallback)

# Testing
pnpm test                   # Run unit tests (Vitest)
pnpm test:watch             # Watch mode
pnpm test -- src/lib/foo    # Run specific test file
pnpm test:integration       # Run integration tests (requires DATABASE_URL)
pnpm test:e2e               # Playwright E2E tests

# Code quality
pnpm lint && pnpm format:check && pnpm typecheck  # Full check (runs in CI)

# Database
pnpm db:generate            # Generate migration from schema changes
pnpm db:migrate             # Run migrations on Neon
pnpm db:push                # Push schema directly (dev only, skips migrations)
pnpm db:studio              # Drizzle Studio GUI
make db-seed                # Import legislators + ZIP data
```

## Architecture

### Astro + React Islands

Server-rendered Astro pages with React components hydrated via `client:load`. API routes in `src/pages/api/` require `export const prerender = false;`. Dev uses `platformProxy` for Cloudflare bindings. **Deployed on Cloudflare Pages** (not Workers) - Pages Functions lack persistent logging; use `wrangler pages deployment tail` for real-time logs.

### Database (Neon + Drizzle)

- Uses Neon serverless Postgres via HTTP driver (`@neondatabase/serverless`)
- Schema in `src/db/schema.ts`, relations in `src/db/relations.ts`, queries in `src/db/queries/`
- **No global caching** - create fresh connection per request: `createDb(import.meta.env.DATABASE_URL)`
- **Neon project**: `floral-term-50641531`
  - **Dev branch**: `br-winter-recipe-afwrwb8w` — always specify this branchId when using Neon MCP tools for dev work (the default branch is prod)
  - **Prod branch**: `br-old-waterfall-afvo9cny` (default) — do not modify without explicit confirmation
- **Migrations (never create migration files manually)**:
  - Schema changes: Update `src/db/schema.ts`, then `pnpm db:generate`
  - Custom/data migrations: `pnpm drizzle-kit generate --custom --name=<name>`, then edit the generated SQL file
  - Apply migrations: `pnpm db:migrate`

#### Drizzle Relational API (MANDATORY)

- **ALWAYS use `db.query.*` relational queries** (`findFirst`, `findMany`) with `with:` for fetching entities with related data. NEVER write manual `.leftJoin()`/`.innerJoin()` + custom select objects when a relational query can do the same thing.
- **SQL-like API (`db.select().from()`) is ONLY for:** aggregation (`count`, `sum`), `GROUP BY`, computed columns (`sql\`...\``), mutations (`insert`/`update`/`delete`), and raw SQL operations. `ILIKE`, `JSONB`, and other `where` operators work fine in the relational API — use it whenever you need related data.
- **When adding a new table:** add the table to `src/db/schema.ts` and define its relations in `src/db/relations.ts`. Do NOT re-export relations from schema.ts (circular dependency). Relations must be defined for EVERY foreign key.
- **When adding a new FK column to an existing table:** update the corresponding `relations()` call in `src/db/relations.ts` immediately.
- **Return types from query functions** should be inferred from Drizzle's relational API, not manually declared interfaces. Export type aliases derived from return types (e.g., `type BillWithSponsor = NonNullable<Awaited<ReturnType<typeof getBillByNumber>>>`).
- **No client-side filtering** — all filtering must happen in the query. Never fetch extra rows and `.find()`/`.filter()` in JS.

### Authentication

Passwordless OTP flow with timing-safe verification:

1. `request-otp`: Hashes email (SHA-256), stores hashed OTP
2. `verify-otp`: Queries by both emailHash AND otpHash (timing-safe comparison in DB)
3. Session cookie: `sameSite: "strict"`, 30-day expiry

**Email addresses are never stored** - only SHA-256 hashes. Middleware validates sessions via single JOIN query.

### Email Providers

Abstraction in `src/lib/email/` supports SMTP (Mailpit locally) and SES. Config via `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`. **WSL2**: Use `127.0.0.1` not `localhost` for SMTP_HOST.

### ZIP Code Lookup

Client-side lookup against `public/data/zip-districts.json`. Server never sees user's ZIP code.

### URL Sanitization

External URLs (e.g., `contactFormUrl`) sanitized via `src/lib/url.ts` - only `.gov` domains allowed.

## Key Patterns

- **Imports**: Use `@/` alias for `src/` paths
- **API routes**: Always add `export const prerender = false;`
- **API routes**: Wrap database operations in try-catch blocks for consistency
- **Database**: Fresh connection per request; `db.query.*` relational API for entity hydration, other Drizzle methods for aggregation/mutations
- **Database types**: Use `.$type<T>()` on Drizzle columns to share types with Zod schemas (avoids duplication)
- **Database relations**: Every FK must have a corresponding `relations()` declaration in `src/db/relations.ts`
- **Tests**: Unit tests colocated as `*.test.ts`, E2E in `tests/e2e/`
- **No `as` casts**: Use type guards and discriminated unions instead of type assertions
- **Lookup objects over if/else chains**: Prefer `const handlers = { a: fn1, b: fn2 }` over `if (x === 'a') ... else if ...`

## Testing Notes

- **API tests location**: Place in `tests/api/`, NOT `src/pages/api/` (Astro treats files there as routes)
- **Use static imports**: Prefer `import { POST } from "@/pages/api/foo"` over dynamic `await import()`
- **Drizzle table names**: Access via `table[Symbol.for("drizzle:Name")]`, not `table._?.name`
- **Integration tests**: `*.integration.test.ts` files require DATABASE_URL and error if missing (don't skip)
- **CI database**: Neon creates a branch per PR; integration tests run in E2E job where DATABASE_URL is available
- **Loading .env in bash**: Use `export $(grep VAR .env | xargs)` not `source .env` (special chars break source)

## Shared Utilities

- **API responses**: `src/lib/api-response.ts` - `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `jsonResponse()`
- **Request parsing**: `src/lib/request-body.ts` - type-safe JSON parsing with validators
- **Moderation**: `src/lib/moderation/` - OpenAI content moderation integration
- **Trust levels**: `src/lib/trust-level.ts` - user trust calculation (`NEW_USER`, `TRUSTED`, `ADMIN`, `BANNED`)

## GitHub & CI

- **Org name**: `anomalousventures` (no hyphen)
- **PR comments**: `gh api repos/anomalousventures/democracy-direct/pulls/{pr}/comments/{id}/replies -f body="..."`
- **CI lint job**: Runs both `eslint` and `prettier --check` - Prettier failures show as lint failures
- **Pre-commit**: lint-staged auto-formats; commits include typecheck

## Skills & Agents

- **`/sync-data`**: Run data import scripts (legislators, zips, votes, templates)
- **`/new-query`**: Scaffold new db query module with integration tests
- **security-reviewer**: Agent for auditing auth/security code changes
