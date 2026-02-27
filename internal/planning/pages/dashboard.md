# Dashboard

<span class="status status-planned">Planned</span>

*Updated: Feb 26, 2026*

## Vision

`openspawn dashboard` serves the React dashboard locally, connected to real agent state via the SQLite coordination layer.

## Current State

The dashboard exists and works for the **BikiniBottom demo** (replay mode). It shows:
- Org chart with agent status indicators
- Live message feed
- Stats bar (kitchen rate, queue, revenue)
- Act-by-act replay with dramatic pacing

**What it doesn't do yet:** connect to real agents or provide controls.

## What Needs Building

### Phase 1: Serve from CLI
```bash
openspawn dashboard          # localhost:3333
openspawn dashboard --port 4000
```
- Bundle dashboard as static assets in the CLI (or `npx` fetch)
- Serve via embedded HTTP server
- Read org config from current directory

### Phase 2: Real Agent Data
- Dashboard reads from SQLite coordination DB
- Agent status (idle/working/busy) from real gateway state
- Task board view — open, claimed, completed, blocked
- Event stream via SSE for live updates

### Phase 3: Controls
| Control | Action |
|---------|--------|
| Hire button | Calls `openspawn hire` → patches gateway |
| Fire button | Calls `openspawn fire` → removes agent |
| Promote/demote | Changes agent level |
| Assign task | Creates task in SQLite, notifies agent |
| Pause/resume | Suspends agent without removing |
| Escalate | Manually push issue up hierarchy |
| Budget adjust | Change per-agent credit limits |

### Phase 4: Monitoring
- Token usage per agent (real-time)
- Task completion rates
- Communication overhead metrics
- Budget burn rate visualization
- Escalation frequency tracking

## Tech Decisions

- **Framework:** React + TanStack Router (already built)
- **Data source:** SQLite DB via REST API served by the CLI
- **Live updates:** Server-Sent Events (SSE)
- **Bundling:** Vite build → embedded in Go binary or served via npx
