# openspawn-langgraph

OpenSpawn adapter for [LangGraph](https://github.com/langchain-ai/langgraph) — coordinate graph execution via OpenSpawn infrastructure.

## Installation

```bash
pip install openspawn-langgraph langgraph
```

## Quick Start

```python
from langgraph.graph import StateGraph
from openspawn import OpenSpawnClient
from openspawn_langgraph import OpenSpawnGraph

# Define your graph as usual
graph = StateGraph(dict)
graph.add_node("researcher", researcher_fn)
graph.add_node("writer", writer_fn)
graph.add_edge("researcher", "writer")
graph.set_entry_point("researcher")
graph.set_finish_point("writer")

# Wrap with OpenSpawn
client = OpenSpawnClient(
    api_url="https://api.openspawn.ai",
    agent_id="my-orchestrator",
    hmac_secret="your-hmac-secret",
)

os_graph = OpenSpawnGraph(graph, client)
compiled = os_graph.compile()
result = compiled.invoke({"topic": "AI trends"})
```

## What Gets Reported

| LangGraph Event | OpenSpawn Action |
|---|---|
| Graph compiled | Nodes registered as agents, parent task created |
| Node entered | `langgraph.node.entered` event emitted |
| Node completed | `langgraph.node.completed` event + state stored as memory |
| Node failed | `langgraph.node.failed` event emitted |

## State Checkpointing

Persist graph state across sessions using OpenSpawn memory:

```python
from openspawn_langgraph import OpenSpawnCheckpointer

checkpointer = OpenSpawnCheckpointer(client)
checkpointer.save("thread-1", {"messages": [...], "step": 3})
state = checkpointer.load("thread-1")
```

## Options

```python
OpenSpawnGraph(
    graph,
    client,
    register_nodes_as_agents=True,  # Register nodes as OpenSpawn agents
    track_transitions=True,         # Emit events on node entry/exit
    store_checkpoints=True,         # Store node output as memory
    agent_level=5,                  # Agent level in hierarchy
)
```

## License

MIT
