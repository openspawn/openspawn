---
title: Getting Started
layout: default
nav_order: 2
---

# Getting Started

Get BikiniBottom running in under 5 minutes.

## Prerequisites

- **Node.js 22+** ([download](https://nodejs.org/))
- **pnpm** (`npm install -g pnpm`)
- **Docker** ([download](https://docker.com/))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/openspawn/openspawn.git
cd openspawn
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 4. Initialize Database

```bash
# Sync schema
node scripts/sync-db.mjs

# Create admin user
node scripts/seed-admin.mjs admin@example.com yourpassword "Your Name"
```

### 5. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The defaults work for local development. For production, update:

- `JWT_SECRET` — Generate with `openssl rand -hex 64`
- `ENCRYPTION_KEY` — Generate with `openssl rand -hex 32`

### 6. Start Services

```bash
# Start API and Dashboard
pnpm exec nx run-many -t serve -p api,dashboard
```

Or in separate terminals:

```bash
# Terminal 1: API
pnpm exec nx run api:serve

# Terminal 2: Dashboard
pnpm exec nx run dashboard:serve
```

## Access

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:4200 |
| **API** | http://localhost:3000 |
| **GraphQL Playground** | http://localhost:3000/graphql |

## Demo Mode

Try BikiniBottom without creating data:

```
http://localhost:4200/?demo=true
```

Demo mode simulates:
- Agent spawning and activation
- Task creation and progression
- Credit earning and spending
- Real-time event feed

### Demo Controls

At the bottom of the screen:
- ▶️ **Play/Pause** — Start or stop simulation
- 🏃 **Speed** — 1× to 50× simulation speed
- 🔄 **Reset** — Return to initial state
- 📊 **Scenario** — Switch between team sizes

## Next Steps

| Guide | What You'll Learn |
|-------|-------------------|
| [Architecture Overview](openspawn/ARCHITECTURE) | System design, data flows, scaling |
| [Agent Lifecycle](openspawn/AGENT-LIFECYCLE) | Onboarding, hierarchy, capabilities |
| [Task Workflow](openspawn/TASK-WORKFLOW) | Templates, routing, auto-assignment |
| [Credit System](openspawn/CREDITS) | Economy, budgets, analytics |
| [API Reference](openspawn/API) | 50+ endpoints documented |
| [Database Schema](openspawn/SCHEMA) | 14 tables explained |

## Troubleshooting

### Database Connection Failed

Make sure PostgreSQL is running:

```bash
docker compose ps
# Should show postgres as "Up"
```

### Port Already in Use

Change the port in your command:

```bash
# API on different port
API_PORT=3001 pnpm exec nx run api:serve

# Dashboard on different port
pnpm exec nx run dashboard:serve -- --port 4201
```

### Login Not Working

1. Verify user exists: `docker exec openspawn-postgres psql -U openspawn -d openspawn -c "SELECT email FROM users;"`
2. Check API logs for errors
3. Clear browser localStorage and try again

---

Need help? [Open an issue](https://github.com/openspawn/openspawn/issues) or [join Discord](https://discord.gg/openspawn).
