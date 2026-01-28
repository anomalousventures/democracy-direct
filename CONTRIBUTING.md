# Contributing to Democracy Direct

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for local email testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/anomalousventures/democracy-direct.git
cd democracy-direct

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your database URL

# Push database schema
pnpm db:push

# Import legislators
pnpm tsx src/scripts/import-legislators.ts

# Start development server with Mailpit
make dev
```

The dev server runs at http://localhost:4321. Mailpit (for viewing emails) runs at http://localhost:8025.

## Development

### Commands

```bash
pnpm dev          # Start dev server
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
  components/     # React components
  db/             # Database schema and queries
  lib/            # Utilities and helpers
  pages/          # Astro pages and API routes
  scripts/        # Data import scripts
tests/
  e2e/            # Playwright tests
docs/             # Documentation
```

### Tech Stack

- **Framework**: Astro with React islands
- **Database**: Neon (serverless Postgres) with Drizzle ORM
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Email**: SMTP with provider abstraction (Mailpit for dev)

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`pnpm test && pnpm lint && pnpm typecheck`)
5. Commit with a descriptive message
6. Push and open a PR

### Commit Messages

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting (no code change)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

## Code Style

- TypeScript strict mode
- ESLint + Prettier (auto-formatted on commit)
- No `any` types without justification
- Prefer functional components with hooks
- Comments explain "why", not "what"

## Questions

Open an issue or reach out at hello@democracy-direct.com.
