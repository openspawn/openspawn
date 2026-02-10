# 🐠 Contributing to BikiniBottom

Welcome to the reef! We're thrilled you want to contribute to BikiniBottom.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+ (or Docker)
- **Nx** (installed globally or via `npx`)

### Setup

```bash
# Clone the repo
git clone https://github.com/openspawn/openspawn.git
cd openspawn

# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
docker run -d --name openspawn-postgres \
  -e POSTGRES_DB=openspawn \
  -e POSTGRES_USER=openspawn \
  -e POSTGRES_PASSWORD=openspawn \
  -p 5432:5432 postgres:15

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run the API
npx nx serve api

# Run the dashboard (separate terminal)
npx nx serve dashboard
```

### Demo Mode

The dashboard runs in demo mode without a backend:

```bash
npx nx serve dashboard  # Add ?demo=true to URL
```

## Development Workflow

### Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `refactor/description` — Code refactoring
- `test/description` — Tests

### Making Changes

1. Create a branch from `main`
2. Make your changes
3. Ensure builds pass: `npx nx build api && npx nx build dashboard`
4. Run tests: `npx nx test api`
5. Push and create a PR

### Pull Requests

- Link related issues
- Describe what changed and why
- Include screenshots for UI changes
- Ensure CI passes
- One approval required to merge

## Code Style

- **Linting**: oxlint (runs in CI)
- **Formatting**: oxfmt
- **TypeScript**: Strict mode, no `any` types
- **React**: Functional components, hooks only
- **Animations**: framer-motion preferred

## Project Structure

```
apps/
  api/          — NestJS backend (GraphQL + REST)
  dashboard/    — React frontend (Vite + TailwindCSS)
libs/
  database/     — TypeORM entities, migrations
  demo-data/    — Demo scenarios and fixtures
  shared-types/ — Shared TypeScript types
  sdk/          — TypeScript SDK (@openspawn/sdk)
sdks/
  python/       — Python SDK (openspawn-py)
skills/
  openclaw/     — OpenClaw AgentSkill
docs/           — Documentation
```

## Need Help?

- Open an [issue](https://github.com/openspawn/openspawn/issues)
- Join our [Discord](https://discord.gg/openspawn)

Thanks for helping make BikiniBottom better! 🌊
