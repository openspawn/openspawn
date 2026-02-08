#!/bin/bash
set -e

echo "🚀 OpenSpawn + OpenClaw Integration Test"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TEST_DIR="/tmp/openspawn-openclaw-test"

echo -e "\n${CYAN}1. Setting up test environment...${NC}"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR/.openclaw/workspace"
cd "$TEST_DIR"

echo -e "${GREEN}✓ Test directory: $TEST_DIR${NC}"

echo -e "\n${CYAN}2. Building OpenSpawn...${NC}"
cd "$PROJECT_DIR"
pnpm exec nx run api:build
pnpm exec nx run mcp:build
echo -e "${GREEN}✓ Build complete${NC}"

echo -e "\n${CYAN}3. Starting API server...${NC}"
# Check if postgres is running
if ! docker ps | grep -q openspawn-postgres; then
    echo "Starting PostgreSQL..."
    docker compose up -d postgres
    sleep 5
fi

# Start API in background
DATABASE_URL="postgresql://openspawn:openspawn@localhost:5432/openspawn" \
ENCRYPTION_KEY="test-key-32-chars-long-xxxxxxxx" \
JWT_SECRET="test-jwt-secret" \
node dist/apps/api/main.js &
API_PID=$!
echo "API PID: $API_PID"

# Wait for API
echo "Waiting for API..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is healthy${NC}"
        break
    fi
    sleep 1
done

echo -e "\n${CYAN}4. Creating test OpenClaw config...${NC}"
cd "$TEST_DIR"

# Create OpenClaw gateway config
cat > .openclaw/gateway.yaml << EOF
# OpenClaw test config
channel: {}
agent:
  model: anthropic/claude-sonnet-4-20250514
mcp:
  servers:
    openspawn:
      command: node
      args:
        - $PROJECT_DIR/dist/apps/mcp/main.js
      env:
        OPENSPAWN_API_URL: http://localhost:3000
        OPENSPAWN_API_KEY: test-key
EOF

cat > .openclaw/workspace/AGENTS.md << 'EOF'
# Test Agent
You are testing OpenSpawn integration.
EOF

echo -e "${GREEN}✓ Config created at $TEST_DIR/.openclaw${NC}"

echo -e "\n${YELLOW}=========================================="
echo "Test environment ready!"
echo "=========================================="
echo -e "${NC}"
echo "To test OpenClaw with OpenSpawn:"
echo ""
echo "  cd $TEST_DIR"
echo "  OPENCLAW_HOME=$TEST_DIR/.openclaw openclaw gateway start"
echo ""
echo "Then in another terminal:"
echo "  OPENCLAW_HOME=$TEST_DIR/.openclaw openclaw chat"
echo ""
echo "Try asking: 'List all agents using OpenSpawn'"
echo ""
echo "To cleanup:"
echo "  kill $API_PID  # Stop API"
echo "  rm -rf $TEST_DIR"
echo ""
