# openspawn-autogen

OpenSpawn adapter for [AutoGen](https://github.com/microsoft/autogen) — coordinate group chats and agent conversations via OpenSpawn infrastructure.

## Installation

```bash
pip install openspawn-autogen pyautogen
```

## Quick Start

### Group Chat

```python
from autogen import ConversableAgent, GroupChat
from openspawn import OpenSpawnClient
from openspawn_autogen import OpenSpawnGroupChat

# Create AutoGen agents
researcher = ConversableAgent(name="researcher", system_message="You research topics")
writer = ConversableAgent(name="writer", system_message="You write reports")
critic = ConversableAgent(name="critic", system_message="You review work")

# Create group chat
group_chat = GroupChat(agents=[researcher, writer, critic], messages=[], max_round=10)

# Wrap with OpenSpawn
client = OpenSpawnClient(
    api_url="https://api.openspawn.ai",
    agent_id="my-orchestrator",
    hmac_secret="your-hmac-secret",
)

os_chat = OpenSpawnGroupChat(group_chat, client)
result = os_chat.run(initiator=researcher, message="Research AI trends for 2025")
```

### Individual Agent Tracking

```python
from openspawn_autogen import OpenSpawnConversableAgent

os_agent = OpenSpawnConversableAgent(researcher, client)
os_agent.register()
os_agent.report_message("Found interesting data", recipient="writer")
os_agent.store_conversation_memory("Full transcript...", summary="Key findings about AI")
```

## What Gets Reported

| AutoGen Event | OpenSpawn Action |
|---|---|
| GroupChat starts | Agents registered, task created, transition to in-progress |
| GroupChat completes | Task done, transcript stored as memory, completion event |
| GroupChat fails | Task blocked, failure event emitted |
| Agent message | `autogen.message.sent` event (optional) |

## Options

### OpenSpawnGroupChat

```python
OpenSpawnGroupChat(
    group_chat,
    client,
    auto_register=True,     # Register agents in OpenSpawn
    agent_level=5,           # Agent level in hierarchy
    store_transcript=True,   # Store chat transcript as memory
)
```

### OpenSpawnConversableAgent

```python
OpenSpawnConversableAgent(
    agent,
    client,
    level=5,                 # Agent level
    role="worker",           # Agent role
    track_messages=True,     # Emit events for messages
)
```

## License

MIT
