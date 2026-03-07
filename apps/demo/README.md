# apps/demo

React dashboard for **bikinibottom.ai**. Visualizes agent activity, tasks, credits, network topology.

## Dev

```bash
pnpm exec nx serve demo          # http://localhost:4200
pnpm exec nx serve demo -- --mode demo  # Demo mode (no backend)
```

## Env Vars

| Variable               | Purpose                        | Default                         |
| ---------------------- | ------------------------------ | ------------------------------- |
| `VITE_DEMO_MODE`       | Run fully client-side (no API) | `false`                         |
| `VITE_API_URL`         | GraphQL API endpoint           | `http://localhost:3000/graphql` |
| `VITE_WS_URL`          | WebSocket endpoint             | `ws://localhost:3000/graphql`   |
| `VITE_SANDBOX_URL`     | Sandbox server override        | Auto-detected                   |
| `VITE_DASHBOARD_THEME` | Theme (`openspawn`)            | —                               |

## Key Pages

`/` dashboard, `/agents`, `/tasks`, `/credits`, `/events`, `/network`, `/messages`, `/kanban`, `/settings`, `/live-view`

## Shared Code

- Hooks: `libs/dashboard-data/src/hooks/`
- UI components: `libs/dashboard-ui/src/ui/`
- Design tokens: `libs/design-tokens/`
- Simulation: `libs/demo-data/`
