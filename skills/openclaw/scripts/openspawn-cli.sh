#!/usr/bin/env bash

# OpenSpawn CLI - A shell wrapper for the OpenSpawn REST API
# Designed for use with OpenClaw agents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
OPENSPAWN_URL="${OPENSPAWN_URL:-}"
OPENSPAWN_API_KEY="${OPENSPAWN_API_KEY:-}"

# Validate configuration
check_config() {
    if [[ -z "$OPENSPAWN_URL" ]]; then
        echo -e "${RED}Error: OPENSPAWN_URL environment variable is not set${NC}" >&2
        echo "Export it with: export OPENSPAWN_URL='https://your-instance.com'" >&2
        exit 1
    fi

    if [[ -z "$OPENSPAWN_API_KEY" ]]; then
        echo -e "${RED}Error: OPENSPAWN_API_KEY environment variable is not set${NC}" >&2
        echo "Export it with: export OPENSPAWN_API_KEY='your-api-key'" >&2
        exit 1
    fi
}

# Check for jq
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed${NC}" >&2
        echo "Install with: brew install jq (macOS) or sudo apt-get install jq (Linux)" >&2
        exit 1
    fi
}

# Make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=${3:-}
    
    local url="${OPENSPAWN_URL}${endpoint}"
    
    if [[ -n "$data" ]]; then
        curl -s -X "$method" "$url" \
            -H "Authorization: Bearer $OPENSPAWN_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$url" \
            -H "Authorization: Bearer $OPENSPAWN_API_KEY"
    fi
}

# Agent commands
agents_list() {
    echo -e "${GREEN}Fetching all agents...${NC}" >&2
    api_request GET "/api/agents" | jq '.'
}

agents_get() {
    local agent_id=$1
    if [[ -z "$agent_id" ]]; then
        echo -e "${RED}Error: Agent ID required${NC}" >&2
        echo "Usage: $0 agents get <agent-id>" >&2
        exit 1
    fi
    
    echo -e "${GREEN}Fetching agent: $agent_id${NC}" >&2
    api_request GET "/api/agents/$agent_id" | jq '.'
}

agents_create() {
    echo -e "${YELLOW}Create a new agent${NC}" >&2
    echo "" >&2
    
    read -p "Agent name: " name
    read -p "Role/persona: " role
    read -p "Model (e.g., gpt-4, claude-3-sonnet): " model
    read -p "Initial instructions: " instructions
    
    local data=$(jq -n \
        --arg name "$name" \
        --arg role "$role" \
        --arg model "$model" \
        --arg instructions "$instructions" \
        '{name: $name, role: $role, model: $model, instructions: $instructions}')
    
    echo -e "${GREEN}Creating agent...${NC}" >&2
    api_request POST "/api/agents" "$data" | jq '.'
}

# Task commands
tasks_list() {
    local query_params=""
    
    # Parse optional filters
    while [[ $# -gt 0 ]]; do
        case $1 in
            --status)
                query_params="${query_params}status=$2&"
                shift 2
                ;;
            --assignee)
                query_params="${query_params}assignee=$2&"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Remove trailing &
    query_params="${query_params%&}"
    
    local endpoint="/api/tasks"
    if [[ -n "$query_params" ]]; then
        endpoint="${endpoint}?${query_params}"
    fi
    
    echo -e "${GREEN}Fetching tasks...${NC}" >&2
    api_request GET "$endpoint" | jq '.'
}

tasks_create() {
    echo -e "${YELLOW}Create a new task${NC}" >&2
    echo "" >&2
    
    read -p "Task title: " title
    read -p "Description: " description
    read -p "Priority (low/medium/high): " priority
    
    local data=$(jq -n \
        --arg title "$title" \
        --arg description "$description" \
        --arg priority "$priority" \
        '{title: $title, description: $description, priority: $priority}')
    
    echo -e "${GREEN}Creating task...${NC}" >&2
    api_request POST "/api/tasks" "$data" | jq '.'
}

tasks_assign() {
    local task_id=$1
    local agent_id=$2
    
    if [[ -z "$task_id" ]] || [[ -z "$agent_id" ]]; then
        echo -e "${RED}Error: Task ID and Agent ID required${NC}" >&2
        echo "Usage: $0 tasks assign <task-id> <agent-id>" >&2
        exit 1
    fi
    
    local data=$(jq -n --arg agent_id "$agent_id" '{agentId: $agent_id}')
    
    echo -e "${GREEN}Assigning task $task_id to agent $agent_id...${NC}" >&2
    api_request PATCH "/api/tasks/$task_id/assign" "$data" | jq '.'
}

tasks_complete() {
    local task_id=$1
    
    if [[ -z "$task_id" ]]; then
        echo -e "${RED}Error: Task ID required${NC}" >&2
        echo "Usage: $0 tasks complete <task-id>" >&2
        exit 1
    fi
    
    echo -e "${GREEN}Marking task $task_id as complete...${NC}" >&2
    api_request PATCH "/api/tasks/$task_id/complete" '{}' | jq '.'
}

# Message commands
messages_send() {
    local from_id=$1
    local to_id=$2
    local content=$3
    
    if [[ -z "$from_id" ]] || [[ -z "$to_id" ]] || [[ -z "$content" ]]; then
        echo -e "${RED}Error: From ID, To ID, and Content required${NC}" >&2
        echo "Usage: $0 messages send <from-agent-id> <to-agent-id> \"message content\"" >&2
        exit 1
    fi
    
    local data=$(jq -n \
        --arg from "$from_id" \
        --arg to "$to_id" \
        --arg content "$content" \
        '{from: $from, to: $to, content: $content}')
    
    echo -e "${GREEN}Sending message from $from_id to $to_id...${NC}" >&2
    api_request POST "/api/messages" "$data" | jq '.'
}

# Metrics commands
metrics_get() {
    echo -e "${GREEN}Fetching metrics...${NC}" >&2
    api_request GET "/api/metrics" | jq '.'
}

# Help
show_help() {
    cat << EOF
OpenSpawn CLI - Manage BikiniBottom/OpenSpawn from the command line

Usage: $0 <command> [options]

Agent Commands:
  agents list                           List all agents
  agents get <id>                       Get agent details
  agents create                         Create a new agent (interactive)

Task Commands:
  tasks list [--status STATUS]          List tasks (optional filters)
             [--assignee AGENT_ID]
  tasks create                          Create a new task (interactive)
  tasks assign <task-id> <agent-id>     Assign a task to an agent
  tasks complete <task-id>              Mark a task as complete

Message Commands:
  messages send <from-id> <to-id>       Send a message between agents
                "content"

Metrics Commands:
  metrics                               Get dashboard metrics

Configuration:
  Set these environment variables:
    OPENSPAWN_URL       Your OpenSpawn instance URL
    OPENSPAWN_API_KEY   Your API key

Examples:
  $0 agents list
  $0 tasks list --status pending
  $0 tasks assign task_123 agent_456
  $0 messages send agent_001 agent_002 "Hello!"
  $0 metrics

EOF
}

# Main command router
main() {
    check_config
    check_jq
    
    local command=${1:-}
    local subcommand=${2:-}
    
    case $command in
        agents)
            case $subcommand in
                list)
                    agents_list
                    ;;
                get)
                    agents_get "${3:-}"
                    ;;
                create)
                    agents_create
                    ;;
                *)
                    echo -e "${RED}Unknown agents subcommand: $subcommand${NC}" >&2
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        tasks)
            case $subcommand in
                list)
                    shift 2
                    tasks_list "$@"
                    ;;
                create)
                    tasks_create
                    ;;
                assign)
                    tasks_assign "${3:-}" "${4:-}"
                    ;;
                complete)
                    tasks_complete "${3:-}"
                    ;;
                *)
                    echo -e "${RED}Unknown tasks subcommand: $subcommand${NC}" >&2
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        messages)
            case $subcommand in
                send)
                    messages_send "${3:-}" "${4:-}" "${5:-}"
                    ;;
                *)
                    echo -e "${RED}Unknown messages subcommand: $subcommand${NC}" >&2
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        metrics)
            metrics_get
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $command${NC}" >&2
            echo "" >&2
            show_help
            exit 1
            ;;
    esac
}

main "$@"
