# Contributing to Democracy Direct

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local email testing with Mailpit)

### Setup

```bash
# Clone the repository
git clone https://github.com/anomalousventures/democracy-direct.git
cd democracy-direct

# Install dependencies
pnpm install

# Copy environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Neon DATABASE_URL

# Create symlink for tools that read .env
ln -s .dev.vars .env

# Push database schema
pnpm db:push

# Start development server with hot reload
make dev
```

The dev server runs at http://localhost:4321. Mailpit (for viewing sent emails) runs at http://localhost:8025.

### Cloudflare Runtime

This project uses Cloudflare Pages with edge runtime. The `react-dom/server.edge` alias is conditionally applied only in production builds to fix React 19 compatibility. In dev mode, `astro dev` uses the adapter's `platformProxy` feature to simulate Cloudflare runtime APIs locally.

## Development

### Commands

```bash
make dev          # Start Mailpit + dev server with hot reload (recommended)
pnpm dev          # Dev server with hot reload
pnpm dev:wrangler # Build + wrangler dev (fallback if astro dev has issues)
pnpm build        # Production build
pnpm test         # Run unit tests
pnpm test:e2e     # Run Playwright E2E tests
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm typecheck    # TypeScript check
```

### Project Structure

```
src/
  components/     # React components (islands)
  db/             # Database schema and queries
  lib/            # Utilities and helpers
  pages/          # Astro pages and API routes
  scripts/        # Data import scripts
tests/
  api/            # API endpoint tests
  e2e/            # Playwright E2E tests
docs/             # Documentation
```

### Tech Stack

- **Framework**: Astro with React islands
- **Runtime**: Cloudflare Pages (edge)
- **Database**: Neon (serverless Postgres) with Drizzle ORM
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Email**: SMTP abstraction (Mailpit for dev, SES for prod)
- **Analytics**: PostHog (privacy-respecting)

## Pull Requests

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Make your changes
3. Run tests (`pnpm test && pnpm lint && pnpm typecheck`)
4. Commit with a descriptive message
5. Push and open a PR

### Commit Messages

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

## Code Style

- TypeScript strict mode
- ESLint + Prettier (auto-formatted on commit via husky)
- No `any` types without justification
- Prefer functional components with hooks
- Comments explain "why", not "what"

## Questions

Open an issue or reach out at hello@democracy-direct.com.
