# OpenSpawn Python SDK

Official Python SDK for the OpenSpawn multi-agent orchestration platform.

## Installation

```bash
pip install openspawn
```

Or with `uv`:

```bash
uv pip install openspawn
```

## Quick Start

### Authentication

OpenSpawn supports two authentication methods:

**API Key Authentication:**

```python
from openspawn import OpenSpawnClient

client = OpenSpawnClient(
    base_url="https://api.openspawn.dev",
    api_key="your-api-key"
)
```

**HMAC Signing (Agent Authentication):**

```python
from openspawn import OpenSpawnClient

client = OpenSpawnClient(
    base_url="https://api.openspawn.dev",
    agent_id="your-agent-id",
    secret="your-hex-secret"  # 64-character hex string
)
```

### Basic Usage

```python
from openspawn import OpenSpawnClient
from openspawn.models import CreateTaskRequest
from openspawn.enums import TaskPriority

# Initialize client
with OpenSpawnClient(
    base_url="https://api.openspawn.dev",
    api_key="your-api-key"
) as client:
    # List agents
    agents = client.agents.list()
    for agent in agents:
        print(f"{agent.name} - Level {agent.level}")
    
    # Create a task
    task = client.tasks.create(
        CreateTaskRequest(
            title="Implement new feature",
            description="Add support for X",
            priority=TaskPriority.HIGH
        )
    )
    print(f"Created task: {task.id}")
    
    # Check credit balance
    balance = client.credits.balance()
    print(f"Current balance: {balance}")
```

### Async Support

The SDK provides full async support with `AsyncOpenSpawnClient`:

```python
import asyncio
from openspawn import AsyncOpenSpawnClient

async def main():
    async with AsyncOpenSpawnClient(
        base_url="https://api.openspawn.dev",
        api_key="your-api-key"
    ) as client:
        # All methods are async
        agents = await client.agents.list()
        tasks = await client.tasks.list()
        balance = await client.credits.balance()

asyncio.run(main())
```

## Resource Modules

### Agents

Manage agents in your organization:

```python
# List all agents
agents = client.agents.list()

# Get specific agent
agent = client.agents.get("agent_id")

# Spawn a new child agent
response = client.agents.spawn(
    name="Worker Agent",
    level=1,
    model="gpt-4"
)
print(f"Secret (save this!): {response['secret']}")

# Get agent hierarchy
hierarchy = client.agents.get_hierarchy("agent_id", depth=3)
```

### Tasks

Create and manage tasks:

```python
from openspawn.models import CreateTaskRequest, TransitionTaskRequest
from openspawn.enums import TaskStatus, TaskPriority

# Create a task
task = client.tasks.create(
    CreateTaskRequest(
        title="Review PR #123",
        description="Code review needed",
        priority=TaskPriority.HIGH,
        assignee_id="agent_id"
    )
)

# List tasks with filters
my_tasks = client.tasks.list(
    status=TaskStatus.IN_PROGRESS,
    assignee_id="agent_id"
)

# Transition task status
updated_task = client.tasks.transition(
    "task_id",
    TransitionTaskRequest(
        status=TaskStatus.REVIEW,
        notes="Ready for review"
    )
)

# Assign task
task = client.tasks.assign("task_id", "assignee_agent_id")
```

### Credits

Manage credit transactions:

```python
from openspawn.models import TransferCreditsRequest

# Get balance
balance = client.credits.balance()

# Transfer credits
transaction = client.credits.transfer(
    TransferCreditsRequest(
        to_agent_id="recipient_agent_id",
        amount=100,
        reason="Task completion bonus"
    )
)

# Get transaction history
transactions, meta = client.credits.history(limit=50, offset=0)
print(f"Total transactions: {meta['total']}")

# Record spending
tx = client.credits.spend(
    amount=10,
    reason="API call",
    trigger_type="llm_call",
    source_task_id="task_id"
)
```

### Messages

Send and retrieve messages:

```python
from openspawn.models import SendMessageRequest
from openspawn.enums import MessageType

# Send a message
message = client.messages.send(
    SendMessageRequest(
        channel_id="channel_id",
        type=MessageType.TEXT,
        body="Hello from Python SDK!"
    )
)

# List messages in a channel
messages = client.messages.list(
    channel_id="channel_id",
    limit=50
)

# Get message thread
thread = client.messages.get_thread("parent_message_id")
```

### Events

Query system events:

```python
from openspawn.enums import EventSeverity
from datetime import datetime, timedelta

# List recent events
events, meta = client.events.list(
    severity=EventSeverity.ERROR,
    start_date=datetime.now() - timedelta(days=7),
    limit=100
)

# Get specific event
event = client.events.get("event_id")
```

## Error Handling

The SDK provides specific exception types:

```python
from openspawn.http_client import (
    APIError,
    AuthenticationError,
    RetryableError,
    OpenSpawnError
)

try:
    agent = client.agents.get("invalid_id")
except AuthenticationError:
    print("Authentication failed - check your credentials")
except APIError as e:
    print(f"API error {e.status_code}: {e.message}")
    print(f"Response data: {e.response_data}")
except RetryableError:
    print("Request failed after retries")
except OpenSpawnError as e:
    print(f"SDK error: {e}")
```

## Retry Logic and Idempotency

The SDK automatically retries failed requests with exponential backoff for retryable errors (408, 429, 5xx status codes).

For idempotent operations (create, transfer, etc.), the SDK automatically includes idempotency keys to prevent duplicate operations.

```python
# This is safe to retry - idempotency key prevents duplicates
client = OpenSpawnClient(
    base_url="https://api.openspawn.dev",
    api_key="your-api-key",
    max_retries=3  # Default: 3 retries
)
```

## Type Safety

The SDK is fully typed with type hints for better IDE support:

```python
from openspawn import OpenSpawnClient
from openspawn.models import Agent, Task

client: OpenSpawnClient = OpenSpawnClient(...)

# Type hints work throughout
agents: list[Agent] = client.agents.list()
task: Task = client.tasks.get("task_id")
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/openspawn/openspawn.git
cd openspawn/sdks/python

# Install dependencies
pip install -e ".[dev]"
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=openspawn --cov-report=html

# Run specific test file
pytest tests/test_agents_resource.py
```

### Code Quality

```bash
# Format code
black src/ tests/

# Lint code
ruff check src/ tests/

# Type checking
mypy src/
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Links

- [Documentation](https://docs.openspawn.dev/sdk/python)
- [GitHub Repository](https://github.com/openspawn/openspawn)
- [API Reference](https://api.openspawn.dev/docs)
- [Report Issues](https://github.com/openspawn/openspawn/issues)
