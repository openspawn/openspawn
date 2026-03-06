# Contributing to OpenSpawn

Coordination layer for AI agent organizations.

## Quick Links

- **GitHub:** https://github.com/openspawn/openspawn
- **Website:** https://openspawn.ai
- **Live Demo:** https://bikinibottom.ai
- **Vision:** VISION.md

## How to Contribute

1. **Bugs and small fixes** — Open a PR
2. **New features or architecture changes** — Start a GitHub Discussion or Issue first
3. **Org templates** — Submit new industry templates via PR
4. **Documentation** — Always welcome

## Development Setup

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install
pnpm test
```

## Testing

**What to write when:**

| Layer | Tool | When | Location |
|-------|------|------|----------|
| Unit | Vitest | Pure functions, utils, transforms | `apps/demo/src/lib/__tests__/` |
| Component | Vitest + RTL | React components in isolation | `*.spec.tsx` next to component |
| E2E | Playwright | User flows, page loads, regressions | `apps/demo/e2e/tests/` |
| Smoke | curl/Playwright | Post-deploy verification | Against production URL |

**PR requirements:**
- New utility functions must have unit tests
- New pages must have a "renders without error" E2E test
- Bug fixes should include a regression test

**Running tests:**

```bash
pnpm exec nx test demo           # Unit + component
pnpm exec nx typecheck demo      # Type check
pnpm exec nx e2e demo            # E2E (builds + starts sandbox)
```

## Animation Rules

- No Framer Motion `layout` on absolutely-positioned elements (layout thrashing)
- Respect `prefers-reduced-motion` via `useReducedMotion`
- Keep interactions under 300ms, use `spring` transitions

## Production Build Rules

- No hardcoded `localhost` URLs — use `getSandboxUrl()` from `src/lib/sandbox-url.ts`
- `VITE_SANDBOX_URL` env var overrides auto-detected URL
- In production (port 80/443), `getSandboxUrl()` returns `''` (same-origin)

## Deploy Checklist

1. `pnpm exec nx typecheck demo` passes
2. `pnpm exec nx test demo` passes
3. `pnpm exec nx build demo` succeeds
4. E2E smoke tests pass against sandbox
5. No `localhost` URLs in network requests (checked by E2E)
6. PR approved and squash-merged

## PR Conventions

- Branch from `main`
- Scoped conventional commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):`
- Squash merge, delete branch after

## AI-Assisted PRs

Welcome. Just be transparent:
- Mark as AI-assisted in PR title or description
- Note testing level (untested / lightly tested / fully tested)
- Confirm you understand what the code does

## Org Templates

To contribute a new template:
1. Create directory under `tools/sandbox/org/`
2. Write ORG.md with agent roles, policies, playbooks
3. Add brief README, open PR

## Code Style

- TypeScript throughout, oxlint + oxfmt for linting/formatting
- Vitest for testing, co-locate tests with source

## Security

See SECURITY.md for responsible disclosure process.
