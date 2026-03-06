# tools/sandbox

Coordination sandbox server. Hosts REST/SSE API and serves pre-built static apps. Runs on port 3333.

In production (bikinibottom.ai), this is the main process inside the Docker container.

## Dev

```bash
pnpm run dev:sandbox              # Sandbox + dashboard together
pnpm exec nx run sandbox:serve    # Sandbox only
```

## Env Vars

| Variable | Purpose | Default |
|----------|---------|---------|
| `SANDBOX_PORT` | Server port | `3333` |
| `SERVE_DASHBOARD` | Serve static dashboard | `0` |
| `DASHBOARD_DIR` | Path to built demo app | Auto-detected |
| `TEAM_DIR` | Path to built team app | Auto-detected |
| `WEBSITE_DIR` | Path to built website | Auto-detected |
| `SANDBOX_READONLY` | Disable mutations | `0` |
| `SANDBOX_MODEL` | LLM model for simulation | `qwen3:0.6b` |

## Static Apps Served (production)

- `dashboard-dist` → demo app (bikinibottom.ai root)
- `team-dist` → team dashboard
- `website-dist` → marketing site
