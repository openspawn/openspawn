# BikiniBottom Sandbox — FastAPI Backend

Drop-in replacement for the Node.js sandbox server, rewritten in Python with FastAPI.

## Quick Start

```bash
cd tools/sandbox-python

# Create venv & install
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Run (dev mode with hot reload)
DEV=1 python run.py
```

Dashboard connects to `http://localhost:3333` — same port, same API.

## Endpoints

All endpoints are 1:1 compatible with the TypeScript sandbox:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/graphql` | GraphQL-compatible (dashboard queries) |
| GET | `/api/stream` | SSE real-time events |
| GET | `/api/state` | Simulation summary |
| GET | `/api/agents` | All agents |
| GET | `/api/tasks` | All tasks |
| GET | `/api/events` | Recent events |
| GET | `/api/metrics` | Time-series metrics |
| GET | `/api/metrics/acp` | ACP protocol metrics |
| POST | `/api/order` | Send order to COO |
| POST | `/api/restart` | Reset simulation |
| POST | `/api/agents/spawn` | Spawn new agent |
| GET/PUT | `/api/speed` | Tick interval control |
| GET | `/api/models` | LLM provider info |

## Docker

```bash
# From repo root:
docker build -f tools/sandbox-python/Dockerfile --platform linux/amd64 -t bikinibottom:fastapi .
```

## Architecture

```
app/
├── types.py        # Pydantic models (SandboxAgent, SandboxTask, etc.)
├── agents.py       # Agent factory (32-agent roster)
├── simulation.py   # Deterministic tick engine
├── mappers.py      # Internal → API response mappers
└── server.py       # FastAPI routes + GraphQL handler
```

Same simulation logic as the TypeScript version. Zero LLM calls — rule-based agents with domain keyword matching and tick-based work progression.
