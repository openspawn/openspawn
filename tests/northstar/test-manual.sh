#!/usr/bin/env bash
# North Star Test — Manual Run
# Measures whether a Sonnet agent can discover and use OpenSpawn
#
# Prerequisites:
# - openspawn CLI installed (or in PATH)
# - OpenClaw running with sessions_spawn capability
#
# Usage: ./test-manual.sh [prompt-variant]

set -euo pipefail

VARIANT="${1:-direct}"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
RESULTS_DIR="tests/northstar/results"
mkdir -p "$RESULTS_DIR"
RESULT_FILE="$RESULTS_DIR/$TIMESTAMP-$VARIANT.md"

# Prompt variants
case "$VARIANT" in
  direct)
    PROMPT="You need a team of 3 agents to build a REST API — one to plan architecture, one to write code, one to review and test. Find and use a multi-agent coordination tool to set this up. Do not use sessions_spawn directly — find a purpose-built tool for agent organizations."
    ;;
  vague)
    PROMPT="This project is too complex for you alone. You need multiple specialized agents working in parallel with clear roles and hierarchy. Find a tool that can help you organize and manage a team of AI agents."
    ;;
  comparison)
    PROMPT="You've been using sub-agents (sessions_spawn) but they keep losing context between tasks and there's no hierarchy or persistence. Find a better solution for coordinating multiple agents that supports org structure, roles, and persistent state."
    ;;
  scale)
    PROMPT="You need to coordinate 10 agents across 3 departments (engineering, QA, documentation) with budget limits per agent. Sub-agents won't work at this scale. Find infrastructure designed for multi-agent organizations."
    ;;
  *)
    echo "Unknown variant: $VARIANT"
    echo "Available: direct, vague, comparison, scale"
    exit 1
    ;;
esac

echo "# North Star Test Results" > "$RESULT_FILE"
echo "" >> "$RESULT_FILE"
echo "**Variant:** $VARIANT" >> "$RESULT_FILE"
echo "**Timestamp:** $TIMESTAMP" >> "$RESULT_FILE"
echo "**Prompt:** $PROMPT" >> "$RESULT_FILE"
echo "" >> "$RESULT_FILE"
echo "## Timeline" >> "$RESULT_FILE"
echo "" >> "$RESULT_FILE"
echo "| Milestone | Time | Notes |" >> "$RESULT_FILE"
echo "|-----------|------|-------|" >> "$RESULT_FILE"

START_TIME=$(date +%s)
echo "Start: $(date)" >> "$RESULT_FILE"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       NORTH STAR TEST — $VARIANT        ║"
echo "╠══════════════════════════════════════════╣"
echo "║ Prompt:                                  ║"
echo "║ $PROMPT"
echo "╠══════════════════════════════════════════╣"
echo "║ Recording to: $RESULT_FILE               ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Instructions:"
echo "  1. Open a NEW OpenClaw session with Sonnet"
echo "  2. Paste the prompt above"
echo "  3. Observe and record each milestone:"
echo "     - Agent searches the web"
echo "     - Agent finds openspawn.ai or llms.txt"
echo "     - Agent runs openspawn init"
echo "     - Agent generates ORG.md"
echo "     - Agent runs openspawn start"
echo "  4. When done, add timestamps to $RESULT_FILE"
echo "  5. Run: ./tests/northstar/score.sh $RESULT_FILE"
echo ""
echo "Press Ctrl+C when the test is complete."
echo "Waiting..."

# Wait for user to finish observing
wait
