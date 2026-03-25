#!/bin/bash
# Usage: report.sh <task-id> <agent-id> <status> <result>
TASK_ID="$1"
AGENT_ID="$2"
STATUS="${3:-completed}"
RESULT="$4"

if [ -z "$TASK_ID" ] || [ -z "$AGENT_ID" ]; then
  echo "Usage: report.sh <task-id> <agent-id> [status] [result]"
  echo "  status: completed (default) or failed"
  exit 1
fi

curl -s -X POST "http://127.0.0.1:3380/a2a/tasks/${TASK_ID}/complete" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"${STATUS}\",\"result\":$(echo "$RESULT" | jq -Rs .)}"
