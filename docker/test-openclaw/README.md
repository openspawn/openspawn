# OpenClaw + OpenSpawn Integration Testing

Test OpenClaw with OpenSpawn in an isolated Docker environment.

## Quick Start

```bash
# 1. Start OpenSpawn services
docker compose up -d postgres api mcp

# 2. Wait for healthy
docker compose ps

# 3. Seed test data
curl -X POST http://localhost:3000/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Agent", "agentId": "test-agent", "level": 5}'

# 4. Test MCP is responding
curl http://localhost:3001/health
```

## Configure OpenClaw

Create a fresh OpenClaw config (won't affect your existing setup):

```bash
# Create test directory
mkdir -p /tmp/openclaw-test/.openclaw
cd /tmp/openclaw-test

# Create MCP config
cat > .openclaw/mcp.json << 'EOF'
{
  "mcpServers": {
    "openspawn": {
      "command": "npx",
      "args": ["-y", "@openspawn/mcp"],
      "env": {
        "OPENSPAWN_API_URL": "http://localhost:3000",
        "OPENSPAWN_API_KEY": "your-api-key"
      }
    }
  }
}
EOF

# Start OpenClaw with this config
OPENCLAW_HOME=/tmp/openclaw-test/.openclaw openclaw gateway start
```

## Full Stack (including OpenClaw)

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start everything
docker compose up -d

# Attach to OpenClaw
docker compose exec openclaw bash
```

## Cleanup

```bash
docker compose down -v  # Remove containers and volumes
rm -rf /tmp/openclaw-test  # Remove test config
```
