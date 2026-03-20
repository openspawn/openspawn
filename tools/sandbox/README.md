# tools/sandbox

Coordination sandbox server. Hosts REST/SSE API and serves pre-built static apps. Runs on port 3333.

In production (bikinibottom.ai), this is the main process inside the Docker container.

## Dev

```bash
pnpm run dev:sandbox              # Sandbox + dashboard together
pnpm exec nx run sandbox:serve    # Sandbox only
```

## Env Vars

| Variable           | Purpose                  | Default            |
| ------------------ | ------------------------ | ------------------ |
| `SANDBOX_PORT`     | Server port              | `3333`             |
| `SERVE_DASHBOARD`  | Serve static dashboard   | `0`                |
| `DASHBOARD_DIR`    | Path to built demo app   | Auto-detected      |
| `TEAM_DIR`         | Path to built team app   | Auto-detected      |
| `WEBSITE_DIR`      | Path to built website    | Auto-detected      |
| `SANDBOX_READONLY` | Disable mutations        | `0`                |
| `SANDBOX_MODEL`    | LLM model for simulation | `qwen3:0.6b`       |
| `SCENARIO`         | Scenario to auto-start   | `krabby-patties`   |

## Scenarios

Available scenarios (set via `SCENARIO` env var):

| ID                  | Name                                    | Duration   | Agents | Description                                                                |
| ------------------- | --------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------- |
| `krabby-patties`    | Operation: 10,000 Krabby Patties        | 3 minutes  | 15+    | Massive order creates a producer-consumer bottleneck. Full org mobilizes.  |
| `krusty-krab-demo`  | The Krusty Krab: A Day in Bikini Bottom | 90 seconds | 6      | Compact demo: delegation, escalation, innovation, and a Plankton heist.   |
| `ai-dev-agency`     | AI Dev Agency                           | ~5 minutes | varies | Software development agency scenario.                                     |
| `warm-up`           | Warm-Up                                 | ~2 minutes | varies | Dynamic starter scenario generated from the org's actual domains.         |

### Krusty Krab Demo (bikinibottom.ai default)

The `krusty-krab-demo` scenario is the featured demo for bikinibottom.ai. It showcases all OpenSpawn features in ~90 seconds:

1. **Task Delegation** — Mr. Krabs assigns "Serve 1,000 customers today"
2. **Role-Based Routing** — SpongeBob cooks, Squidward takes orders, Patrick restocks
3. **Escalation** — Patrick messes up → SpongeBob fixes it → Mr. Krabs decides
4. **Cross-Team Coordination** — Sandy invents the Turbo Fryer 3000 → SpongeBob adopts it
5. **Adversarial Event** — Plankton steals toward the formula → security alert → Mr. Krabs handles
6. **Credit Economy** — Agents earn credits for completed tasks, get penalized for failures

Org definition: [`org/krusty-krab.md`](./org/krusty-krab.md)

## Static Apps Served (production)

- `dashboard-dist` → demo app (bikinibottom.ai root)
- `team-dist` → team dashboard
- `website-dist` → marketing site
