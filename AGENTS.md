# AGENTS.md — BikiniBottom Development Guide

## Project Overview

BikiniBottom is a multi-agent coordination platform. The dashboard visualises agent activity, tasks, credits, network topology, and more. The sandbox server (`tools/sandbox/`) serves both the REST/SSE API and the pre-built dashboard on port 3333.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Nx |
| Frontend | React 19, TanStack Query, Framer Motion, Tailwind CSS |
| Build | Vite |
| Unit/Component Tests | Vitest |
| E2E Tests | Playwright |
| Package Manager | pnpm |

## Testing Pyramid

```
        ┌──────────┐
        │  Deploy   │  ← smoke tests against production URL
        │  Smoke    │
       ┌┴──────────┴┐
       │    E2E      │  ← Playwright against sandbox (port 3333)
      ┌┴────────────┴┐
      │  Component    │  ← Vitest + React Testing Library
     ┌┴──────────────┴┐
     │     Unit        │  ← Vitest (pure functions, utils)
     └────────────────┘
```

### When to Write What

- **Unit tests** — Pure functions, utilities, data transformations (`apps/dashboard/src/lib/__tests__/`)
- **Component tests** — React components in isolation with mocked data (`*.spec.tsx` next to component)
- **E2E tests** — User flows, page loads, regression checks (`apps/dashboard/e2e/tests/`)
- **Deploy smoke** — Post-deploy verification against live URL

### Testing Requirements for PRs

- All new utility functions must have unit tests
- New pages must have at least a "renders without error" E2E test
- Bug fixes should include a regression test
- Run `npx nx test dashboard` and `npx nx typecheck dashboard` before pushing

## Running Tests Locally

```bash
# Unit + component tests
npx nx test dashboard

# Typecheck
npx nx typecheck dashboard

# E2E (builds dashboard + starts sandbox automatically)
npx nx e2e dashboard

# E2E with UI
cd apps/dashboard/e2e && npx playwright test --ui
```

## Animation Rules

- **No Framer Motion `layout` on absolutely-positioned elements** — causes layout thrashing
- **Respect `prefers-reduced-motion`** — wrap animations in media query checks or use Framer Motion's `useReducedMotion`
- Keep animations under 300ms for UI interactions
- Use `spring` transitions for natural feel

## Production Build Rules

- **No hardcoded `localhost` URLs** — use `getSandboxUrl()` from `src/lib/sandbox-url.ts`
- The `VITE_SANDBOX_URL` env var overrides the auto-detected URL
- In production (port 80/443), `getSandboxUrl()` returns `''` (same-origin)

## Deploy Checklist

1. `npx nx typecheck dashboard` passes
2. `npx nx test dashboard` passes
3. `npx nx build dashboard` succeeds
4. E2E smoke tests pass against sandbox
5. No `localhost` URLs in network requests (checked by E2E)
6. PR approved and squash-merged

## PR Conventions

- Branch from `main`
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Squash merge to keep history clean
- Delete branch after merge

## Key Directories

```
apps/dashboard/          — React dashboard app
  src/lib/               — Utility functions
  src/components/        — Shared components
  src/pages/             — Route pages
  e2e/                   — Playwright E2E tests (sandbox mode)
tools/sandbox/           — Sandbox API server
e2e/legacy/              — Legacy E2E tests (stale, targets dev ports)
```
