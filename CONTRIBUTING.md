# Contributing to OpenSpawn

Coordination layer for AI agent organizations.

## Quick Links

- **GitHub:** https://github.com/openspawn/openspawn
- **Website:** https://openspawn.ai
- **Live Demo:** https://bikinibottom.ai
- **Vision:** VISION.md

## Domains & Deployment

All services run on a single VPS. Caddy handles HTTPS + routing. Cloudflare proxied.
Deploy via `deploy.yml`, `deploy-platform.yml`, and `deploy-docs.yml` workflows.

**Live:**

| Domain                | What                                                            |
| --------------------- | --------------------------------------------------------------- |
| **openspawn.ai**      | Marketing website (React SPA, serves llms.txt + A2A agent.json) |
| **api.openspawn.ai**  | Core API — GraphQL + REST (Python rewrite WIP)                  |
| **bikinibottom.ai**   | Demo sandbox + dashboard                                        |
| **team.openspawn.ai** | Internal team dashboard (password-protected)                    |
| **id.openspawn.ai**   | SSO/identity provider (OIDC)                                    |
| **wiki.openspawn.ai** | Internal knowledge base                                         |

**Reserved (DNS exists, not deployed):**

| Domain                    | Intent                                                      |
| ------------------------- | ----------------------------------------------------------- |
| **docs.openspawn.ai**     | Redirects to openspawn.ai/docs/ (consolidated into website) |
| **hub.openspawn.ai**      | Agent/skill marketplace UI                                  |
| **logs.openspawn.ai**     | Centralized logging/observability dashboard                 |
| **mcp.openspawn.ai**      | Dedicated MCP endpoint (standalone)                         |
| **registry.openspawn.ai** | Agent/package registry API                                  |
| **status.openspawn.ai**   | Public status page                                          |

## How to Contribute

1. **Bugs and small fixes** — Open a PR
2. **New features or architecture changes** — Start a GitHub Discussion or Issue first
3. **Org templates** — Submit new industry templates via PR
4. **Documentation** — Always welcome

## Development Setup

**Prerequisites:** Node.js 18+, pnpm, Python 3.12+, [uv](https://docs.astral.sh/uv/)

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn
pnpm install                              # frontend dependencies
cd apps/api && uv sync && cd ../..        # Python API dependencies
pnpm test
```

**Running the coordinator locally:**

```bash
npx openspawn start   # starts FastAPI on SQLite — no Docker or Postgres needed
```

## Common Tasks

### Add a new dashboard page

1. Create `apps/dashboard/src/pages/my-page.tsx`
2. Export from `apps/dashboard/src/pages/index.ts`
3. Add route in `apps/dashboard/src/app/app.tsx`
4. Add nav link in `apps/dashboard/src/components/layout.tsx`

### Add demo data

1. Add fixtures to `libs/demo-data/src/fixtures/`
2. Export from `libs/demo-data/src/fixtures/index.ts`
3. Update scenarios in `libs/demo-data/src/scenarios/`

## Testing

**What to write when:**

| Layer     | Tool            | When                                | Location                       |
| --------- | --------------- | ----------------------------------- | ------------------------------ |
| Unit      | Vitest          | Pure functions, utils, transforms   | `apps/dashboard/src/lib/__tests__/` |
| Component | Vitest + RTL    | React components in isolation       | `*.spec.tsx` next to component |
| API       | pytest          | API endpoints, agent spawning       | `apps/api/tests/`              |
| E2E       | Playwright      | User flows, page loads, regressions | `apps/dashboard/e2e/tests/`         |
| Smoke     | curl/Playwright | Post-deploy verification            | Against production URL         |
| Profiling | pytest + script | Latency benchmarks, perf regression | `apps/api/tests/`, `scripts/`  |

**PR requirements:**

- New utility functions must have unit tests
- New pages must have a "renders without error" E2E test
- Bug fixes should include a regression test

**Running tests:**

```bash
pnpm exec nx test dashboard           # Unit + component
pnpm exec nx typecheck dashboard      # Type check
pnpm exec nx e2e demo-e2e            # E2E (builds + starts sandbox)
cd apps/api && uv run pytest     # Python API tests
```

**Latency profiling:**

```bash
# CI benchmarks — coordination algorithm latency (always $0)
cd apps/api && uv run pytest tests/test_latency_profile.py -v -s

# Manual profiling — measures real API response times against a running server
# Run after `npx openspawn start` or against production
python scripts/latency-profile.py --base-url http://localhost:8000
```

The manual script profiles health checks, agent/task CRUD, routing, transitions, and memory ops. Outputs a formatted table + CSV. Use it before deploys, after infra changes, or to evaluate hosting performance.

## Animation Rules

- No Framer Motion `layout` on absolutely-positioned elements (layout thrashing)
- Respect `prefers-reduced-motion` via `useReducedMotion`
- Keep interactions under 300ms, use `spring` transitions

## Production Build Rules

- No hardcoded `localhost` URLs — use `getSandboxUrl()` from `src/lib/sandbox-url.ts`
- `VITE_SANDBOX_URL` env var overrides auto-detected URL
- In production (port 80/443), `getSandboxUrl()` returns `''` (same-origin)

## Deploy Checklist

1. `pnpm exec nx typecheck dashboard` passes
2. `pnpm exec nx test dashboard` passes
3. `pnpm exec nx build dashboard` succeeds
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

- TypeScript (frontend) + Python (API), oxlint + oxfmt for TS linting/formatting
- Vitest for frontend tests, pytest for API tests, co-locate tests with source

## Security

See SECURITY.md for responsible disclosure process.
