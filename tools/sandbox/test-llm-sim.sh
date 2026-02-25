#!/bin/bash
# ── LLM Simulation Test Script ──────────────────────────────────────────────
# Boots Ollama (if needed), runs sandbox in record mode for N ticks,
# captures output and recordings, reports results.
#
# Usage: ./test-llm-sim.sh [max_ticks]
# Default: 50 ticks (enough to see LLM decisions without burning time)

set -euo pipefail

MAX_TICKS=${1:-50}
MODEL="qwen2.5:7b-instruct"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="/tmp/llm-sim-test-$(date +%Y%m%d-%H%M%S).log"
RESULT_FILE="/tmp/llm-sim-test-result.txt"

echo "🧠 LLM Simulation Test — $MAX_TICKS ticks with $MODEL"
echo "📝 Log: $LOG_FILE"
echo ""

# ── 1. Check/start Ollama ────────────────────────────────────────────────────
if ! pgrep -x "ollama" > /dev/null 2>&1; then
  echo "🔄 Starting Ollama..."
  ollama serve > /dev/null 2>&1 &
  sleep 3
fi

# Verify model is available
if ! ollama list 2>/dev/null | grep -q "$MODEL"; then
  echo "❌ Model $MODEL not found. Pull it first: ollama pull $MODEL"
  exit 1
fi

echo "✅ Ollama running, $MODEL available"

# ── 2. Run sandbox in record mode ───────────────────────────────────────────
echo "🚀 Starting sandbox in record mode ($MAX_TICKS ticks)..."
echo ""

cd "$SCRIPT_DIR"

# Run with a tick limit via MAX_TICKS env var
# The sandbox doesn't have a built-in tick limit, so we'll use timeout
# At 2s/tick for LLM mode, 50 ticks ≈ 100s. Add buffer.
TIMEOUT_SECS=$(( MAX_TICKS * 4 + 30 ))

SIMULATION_MODE=record \
LLM_MODEL="$MODEL" \
LLM_BASE_URL="http://localhost:11434" \
MAX_TICKS="$MAX_TICKS" \
SANDBOX_PORT=13333 \
  timeout "${TIMEOUT_SECS}s" npx tsx src/index.ts 2>&1 | tee "$LOG_FILE" || true

echo ""
echo "────────────────────────────────────────"

# ── 3. Analyze results ──────────────────────────────────────────────────────
ERRORS=$(grep -c "ERROR\|Error\|error\|❌\|FATAL\|panic\|unhandled" "$LOG_FILE" 2>/dev/null || echo "0")
LLM_DECISIONS=$(grep -c "🧠\|LLM decision\|decision:" "$LOG_FILE" 2>/dev/null || echo "0")
TICKS_RUN=$(grep -c "^═.*TICK" "$LOG_FILE" 2>/dev/null || echo "0")
FALLBACKS=$(grep -c "fallback\|Fallback\|deterministic fallback" "$LOG_FILE" 2>/dev/null || echo "0")

# Check for recordings
RECORDINGS=$(find "$SCRIPT_DIR/scenarios/recorded" -name "*.md" -newer "$LOG_FILE" 2>/dev/null | wc -l | tr -d ' ')

cat > "$RESULT_FILE" << EOF
# LLM Simulation Test Results — $(date +%Y-%m-%d\ %H:%M)

| Metric | Value |
|---|---|
| Ticks run | $TICKS_RUN / $MAX_TICKS |
| LLM decisions | $LLM_DECISIONS |
| Fallbacks to deterministic | $FALLBACKS |
| Errors detected | $ERRORS |
| Recordings created | $RECORDINGS |
| Model | $MODEL |
| Log | $LOG_FILE |

$(if [ "$ERRORS" -gt 0 ]; then echo "## ⚠️ Errors Found"; grep -n "ERROR\|Error\|❌\|FATAL" "$LOG_FILE" | head -20; fi)
EOF

echo ""
cat "$RESULT_FILE"

if [ "$ERRORS" -gt 5 ]; then
  echo ""
  echo "❌ Too many errors — needs fixing before recording is usable"
  exit 1
elif [ "$TICKS_RUN" -lt $(( MAX_TICKS / 2 )) ]; then
  echo ""
  echo "⚠️ Only ran $TICKS_RUN/$MAX_TICKS ticks — may have crashed early"
  exit 1
else
  echo ""
  echo "✅ Test completed successfully"
  exit 0
fi
