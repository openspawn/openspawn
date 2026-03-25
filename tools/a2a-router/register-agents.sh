#!/bin/bash
# Auto-register local agents with the A2A router
# Run after router starts

ROUTER="http://127.0.0.1:3380"

# Wait for router
for i in {1..10}; do
  curl -s "$ROUTER/health" > /dev/null 2>&1 && break
  sleep 2
done

# Dennis
curl -s -X POST "$ROUTER/a2a/agents" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"dennis\",\"name\":\"Agent Dennis\",\"skills\":[\"openspawn\",\"coding\",\"devops\"],\"gateway_url\":\"http://127.0.0.1:18789\",\"gateway_token\":\"de7a80e75773fcf0bba22349f7bf21498bfb389a6a15283b\",\"hook_path\":\"/hooks/agent\"}" > /dev/null

# Drinkify
curl -s -X POST "$ROUTER/a2a/agents" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"drinkify\",\"name\":\"Agent Drinkify\",\"skills\":[\"drinkify\",\"e-commerce\",\"frontend\"],\"gateway_url\":\"http://127.0.0.1:18810\",\"gateway_token\":\"a2a-drinkify-hook-token-2026\",\"hook_path\":\"/hooks/agent\"}" > /dev/null

echo "Agents registered: $(curl -s $ROUTER/a2a/agents | jq -r '[.[].agent_id] | join(", ")')"
