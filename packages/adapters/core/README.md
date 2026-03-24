# openspawn

Python client for the [OpenSpawn](https://openspawn.ai) agent infrastructure API.

## Installation

```bash
pip install openspawn
```

## Quick Start

```python
from openspawn import OpenSpawnClient

client = OpenSpawnClient(
    api_url="https://api.openspawn.ai",
    agent_id="my-agent",
    hmac_secret="your-hmac-secret",
)

# Register an agent
agent = client.register_agent("worker-1", "My Worker", level=3)

# Create a task
task = client.create_task("Analyze data", priority="high")

# Transition task status
client.transition_task(task.id, "in_progress")

# Store a memory
client.store_memory("Important finding about X", memory_type="lesson")

# Emit a coordination event
client.emit_event("task.completed", {"task_id": task.id, "result": "success"})
```

## Authentication

OpenSpawn uses HMAC-SHA256 for agent authentication. The client handles JWT exchange automatically:

1. Signs requests with your HMAC secret
2. Exchanges for a short-lived JWT
3. Caches and auto-refreshes the JWT

## API Coverage

| Operation | Method |
|---|---|
| Register agent | `register_agent()` |
| List/get/update agents | `list_agents()`, `get_agent()`, `update_agent()` |
| Create task | `create_task()` |
| Transition task | `transition_task()` |
| Assign task | `assign_task()` |
| Comment on task | `add_task_comment()` |
| Store memory | `store_memory()` |
| Search memory | `search_memory()` |
| Emit event | `emit_event()` |

## Error Handling

```python
from openspawn.client import (
    OpenSpawnError,       # Base exception
    AuthenticationError,  # HMAC/JWT failures
    RateLimitError,       # 429 responses
    NotFoundError,        # 404 responses
)
```

## Framework Adapters

Use OpenSpawn with your preferred AI framework:

- [`openspawn-crewai`](../crewai/) — CrewAI adapter
- [`openspawn-langgraph`](../langgraph/) — LangGraph adapter
- [`openspawn-autogen`](../autogen/) — AutoGen adapter

## License

MIT
