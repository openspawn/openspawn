# Multi-Agent Gateway Setup

How to spin up an OpenSpawn org with multiple agents on a dedicated OpenClaw gateway.

## Why a Separate Gateway?

OpenClaw serializes agent runs on a single gateway — hooks queue behind active sessions. If your main agent (Dennis) is in a Telegram conversation, hook-triggered runs for other agents wait indefinitely.

**Solution:** Each OpenSpawn org gets its own gateway. Agents within that org share the gateway and can run concurrently (hooks process in gaps between runs).

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│ Dennis Gateway      │     │ Demo Org Gateway     │
│ (host :18789)       │     │ (Docker :18820)      │
│                     │     │                      │
│ - main (Dennis)     │     │ - pm (Sonnet)        │
│ - Telegram/Discord  │     │ - writer (Haiku)     │
│                     │     │ - reviewer (Haiku)   │
│                     │     │ - engineer (Haiku)   │
│                     │     │ - designer (Haiku)   │
└────────┬────────────┘     └──────────┬───────────┘
         │                             │
         └──────────┬──────────────────┘
                    │
            ┌───────▼───────┐
            │ A2A Router    │
            │ (host :3380)  │
            │ SQLite tasks  │
            └───────────────┘
```

## Step-by-Step

### 1. Create Agent Workspaces

Use the OpenSpawn CLI to scaffold agent workspaces with auto-generated AGENTS.md, SOUL.md, and the a2a-reporter skill:

```bash
# Single agent
openspawn agent create Writer \
  --role writer \
  --level 5 \
  --skills "docs,markdown,tutorials" \
  --model "anthropic/claude-3-5-haiku-latest"

# Batch create from config
openspawn agent create-batch agents.json
```

**agents.json example:**
```json
{
  "agents": [
    {"name": "PM", "role": "project-manager", "level": 7, "skills": ["planning","decomposition"], "model": "anthropic/claude-sonnet-4-5"},
    {"name": "Writer", "role": "writer", "level": 5, "skills": ["docs","markdown"], "model": "anthropic/claude-3-5-haiku-latest"},
    {"name": "Reviewer", "role": "editor", "level": 5, "skills": ["review","quality"], "model": "anthropic/claude-3-5-haiku-latest"},
    {"name": "Engineer", "role": "developer", "level": 5, "skills": ["code","typescript"], "model": "anthropic/claude-3-5-haiku-latest"},
    {"name": "Designer", "role": "ux-designer", "level": 5, "skills": ["design","sitemap"], "model": "anthropic/claude-3-5-haiku-latest"}
  ]
}
```

Workspaces are created at `~/.openspawn/agents/<agent-id>/workspace/`.

### 2. Set Up the Gateway Directory

Create a dedicated config directory for the org:

```bash
mkdir -p ~/.openclaw-<org-name>/{config,workspace}
```

#### Copy agent workspaces

```bash
for agent in pm writer reviewer engineer designer; do
  mkdir -p ~/.openclaw-<org-name>/workspace/agents/$agent/skills
  cp -r ~/.openspawn/agents/$agent/workspace/* ~/.openclaw-<org-name>/workspace/agents/$agent/
done
```

#### Fix Docker networking in agent files

Inside Docker, agents can't reach `127.0.0.1` on the host. Replace with `host.docker.internal`:

```bash
find ~/.openclaw-<org-name>/workspace -name "*.md" -o -name "*.sh" | \
  xargs sed -i 's|127.0.0.1:3380|host.docker.internal:3380|g'
```

### 3. Create OpenClaw Config

**`~/.openclaw-<org-name>/config/openclaw.json`:**

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-3-5-haiku-latest"
      },
      "compaction": {
        "mode": "safeguard",
        "reserveTokensFloor": 5000
      }
    },
    "list": [
      {
        "id": "pm",
        "default": true,
        "workspace": "/home/node/.openclaw/workspace/agents/pm",
        "model": {"primary": "anthropic/claude-sonnet-4-5"},
        "tools": {"profile": "full"}
      },
      {
        "id": "writer",
        "workspace": "/home/node/.openclaw/workspace/agents/writer",
        "tools": {"profile": "coding"}
      },
      {
        "id": "reviewer",
        "workspace": "/home/node/.openclaw/workspace/agents/reviewer",
        "tools": {"profile": "coding"}
      },
      {
        "id": "engineer",
        "workspace": "/home/node/.openclaw/workspace/agents/engineer",
        "tools": {"profile": "full"}
      },
      {
        "id": "designer",
        "workspace": "/home/node/.openclaw/workspace/agents/designer",
        "tools": {"profile": "coding"}
      }
    ]
  },
  "hooks": {
    "enabled": true,
    "token": "<generate-a-random-token>",
    "allowedAgentIds": ["*"],
    "allowRequestSessionKey": true,
    "allowedSessionKeyPrefixes": ["a2a:", "hook:"]
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "mode": "local",
    "auth": {
      "mode": "token",
      "token": "<generate-a-random-token>"
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  }
}
```

**Important config notes:**
- `bind: "0.0.0.0"` — required for Docker port mapping to work. OpenClaw normalizes this to `"lan"`.
- `hooks.allowedAgentIds: ["*"]` — allows routing hooks to any agent on the gateway.
- `tools.profile` — valid values: `"minimal"`, `"coding"`, `"messaging"`, `"full"`. There is no `"standard"`.
- Agent model overrides use `"model": {"primary": "..."}`. Don't set model to `null` — omit the field entirely to use the default.
- Workspace paths inside the container must match the Docker volume mount.

### 4. Set Up Auth Profiles

Each agent needs access to the LLM provider. Copy your auth profile:

```bash
# Create the main auth profile
cat > ~/.openclaw-<org-name>/config/auth-profiles.json << 'EOF'
{
  "version": 1,
  "profiles": {
    "anthropic:default": {
      "type": "token",
      "provider": "anthropic",
      "token": "<your-anthropic-token>"
    }
  }
}
EOF

# Copy to each agent
for agent in pm writer reviewer engineer designer; do
  mkdir -p ~/.openclaw-<org-name>/config/agents/$agent/agent
  cp ~/.openclaw-<org-name>/config/auth-profiles.json \
     ~/.openclaw-<org-name>/config/agents/$agent/agent/auth-profiles.json
done
```

### 5. Create Entrypoint & Docker Compose

**`~/.openclaw-<org-name>/entrypoint.sh`:**
```bash
#!/bin/sh
set -e
echo "[Org] Running config doctor before startup..."
node /app/openclaw.mjs doctor --fix --non-interactive 2>&1 || echo "[Org] Doctor returned non-zero, continuing..."
echo "[Org] Starting gateway..."
exec node /app/openclaw.mjs gateway --allow-unconfigured
```

**`~/.openclaw-<org-name>/docker-compose.yml`:**
```yaml
services:
  gateway:
    image: alpine/openclaw:latest
    container_name: <org-name>-gateway
    entrypoint: ["/bin/sh", "/home/node/entrypoint.sh"]
    ports:
      - "127.0.0.1:<host-port>:18789"
    volumes:
      - ${HOME}/.openclaw-<org-name>/entrypoint.sh:/home/node/entrypoint.sh:ro
      - ${HOME}/.openclaw-<org-name>/config:/home/node/.openclaw
      - ${HOME}/.openclaw-<org-name>/workspace:/home/node/.openclaw/workspace
    environment:
      - NODE_ENV=production
      - HOME=/home/node
    user: root
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2g
          cpus: "1.0"
```

**Port allocation convention:**
| Gateway | Port |
|---------|------|
| Dennis (main) | 18789 |
| Drinkify | 18810 |
| Demo org | 18820 |
| Next org | 18830 |

### 6. Start the Gateway

```bash
cd ~/.openclaw-<org-name>
docker compose up -d

# Verify
docker logs <org-name>-gateway --tail 5
curl -s http://127.0.0.1:<host-port>/health
```

You should see:
```
[gateway] agent model: anthropic/claude-3-5-haiku-latest
[gateway] listening on ws://0.0.0.0:18789
{"ok":true,"status":"live"}
```

### 7. Register Agents with A2A Router

```bash
HOOK_TOKEN="<the-hooks-token-from-config>"

for agent in pm writer reviewer engineer designer; do
  curl -s -X POST http://127.0.0.1:3380/a2a/agents \
    -H "Content-Type: application/json" \
    -d "{
      \"agentId\": \"$agent\",
      \"name\": \"$agent\",
      \"skills\": [],
      \"gateway_url\": \"http://127.0.0.1:<host-port>\",
      \"gateway_token\": \"$HOOK_TOKEN\",
      \"hook_path\": \"/hooks/agent\"
    }" > /dev/null
  echo "Registered: $agent"
done
```

**Note:** Use the `hooks.token` (not `gateway.auth.token`) for the `gateway_token`. These are different:
- `gateway.auth.token` — WebSocket/Control UI auth
- `hooks.token` — webhook endpoint auth (this is what the A2A router uses)

### 8. Test

```bash
# Send a message via A2A
curl -s -X POST http://127.0.0.1:3380/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-1",
    "method": "message/send",
    "params": {
      "agentId": "pm",
      "senderId": "dennis",
      "message": {
        "kind": "message",
        "messageId": "test-msg-1",
        "role": "user",
        "parts": [{"kind": "text", "text": "Hello! Confirm your name and role."}]
      }
    }
  }' | jq .result.id

# Poll for result
curl -s http://127.0.0.1:3380/a2a/tasks/<task-id> | jq '{status, result}'
```

## Troubleshooting

### Hook returns `ok:true` but agent never processes

1. **Lane contention** — Another agent on the same gateway has an active session. Hooks queue behind active runs. Solution: use a dedicated gateway per org.

2. **Wrong URL in AGENTS.md** — Inside Docker, `127.0.0.1` refers to the container, not the host. Use `host.docker.internal` for the A2A router URL.

3. **Missing auth profiles** — Each agent needs `auth-profiles.json` in `~/.openclaw/agents/<id>/agent/`. Without it, the LLM call silently fails.

4. **Invalid model name** — Use full Anthropic model IDs: `anthropic/claude-3-5-haiku-latest`, `anthropic/claude-sonnet-4-5`. Not `anthropic/claude-haiku-3-5`.

### Agent processes but doesn't report completion

1. **Router unreachable** — The agent tried to call `127.0.0.1:3380` but that's the container's localhost. Fix AGENTS.md and a2a-reporter skill to use `host.docker.internal:3380`.

2. **Skill not loaded** — Check that `skills/a2a-reporter/SKILL.md` exists in the agent's workspace and is referenced in the available skills list.

### Config validation errors

- `tools.profile: Invalid input` — Valid values: `minimal`, `coding`, `messaging`, `full`. No `standard`.
- `agents.list.N.model: Invalid input` — Don't set model to `null`. Either set `{"primary": "model/name"}` or omit the field entirely.
- `hooks.enabled requires hooks.token` — Must set `hooks.token` when `hooks.enabled` is `true`.

## Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Dennis Gateway | 18789 | Main agent (Telegram/Discord) |
| Drinkify Gateway | 18810 | Drinkify agent (Docker) |
| Demo Org Gateway | 18820 | Multi-agent demo (Docker) |
| A2A Router | 3380 | Task routing + agent registry |
| OpenSpawn API | 8000 (VPS) | Dashboard API |
