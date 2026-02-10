---
title: LangGraph Adapter
layout: default
parent: Features
nav_order: 12
---

# 🦜 LangGraph + BikiniBottom

Use BikiniBottom as the coordination layer for your LangGraph workflows — persistent tasks, credit tracking, and real-time visibility.

## Overview

LangGraph handles your agent's state machine logic. BikiniBottom handles everything around it: task queuing, budget enforcement, agent registry, and audit trails.

```
LangGraph Graph ←→ BikiniBottom Python SDK ←→ BikiniBottom API
```

## Setup

```bash
pip install openspawn langgraph langchain-core
```

## Pattern 1: Task-Driven Graph Execution

The most common pattern — BikiniBottom assigns tasks, LangGraph executes them.

```python
from openspawn import OpenSpawnClient
from langgraph.graph import StateGraph, END
from typing import TypedDict

bb = OpenSpawnClient(base_url="http://localhost:3000", api_key="your-key")

# Define your LangGraph state
class AgentState(TypedDict):
    task_id: str
    task_description: str
    result: str
    credits_used: int

# Define nodes
def research(state: AgentState) -> AgentState:
    # Your LLM call here
    result = call_llm(state["task_description"])
    return {**state, "result": result, "credits_used": 150}

def report_back(state: AgentState) -> AgentState:
    # Report completion to BikiniBottom
    bb.tasks.complete(state["task_id"], result=state["result"])
    bb.credits.report_usage(
        agent_id=AGENT_ID,
        tokens_used=state["credits_used"],
        model="gpt-4"
    )
    return state

# Build graph
graph = StateGraph(AgentState)
graph.add_node("research", research)
graph.add_node("report", report_back)
graph.add_edge("research", "report")
graph.add_edge("report", END)
graph.set_entry_point("research")
app = graph.compile()

# Main loop: claim tasks from BikiniBottom
while True:
    task = bb.tasks.claim(agent_id=AGENT_ID, capabilities=["research"])
    if not task:
        time.sleep(5)
        continue

    # Check budget before executing
    agent = bb.agents.get(AGENT_ID)
    if agent.current_balance < 100:
        bb.tasks.reject(task.id, reason="Insufficient credits")
        continue

    # Execute the graph
    app.invoke({
        "task_id": task.id,
        "task_description": task.description,
        "result": "",
        "credits_used": 0,
    })
```

## Pattern 2: Credit-Aware Nodes

Gate expensive operations on available budget.

```python
def should_use_gpt4(state: AgentState) -> str:
    """Routing function: use GPT-4 if budget allows, else GPT-3.5."""
    agent = bb.agents.get(AGENT_ID)
    if agent.current_balance > 500:
        return "gpt4_node"
    return "gpt35_node"

graph.add_conditional_edges("start", should_use_gpt4, {
    "gpt4_node": "gpt4_research",
    "gpt35_node": "gpt35_research",
})
```

## Pattern 3: Multi-Agent Graph with Hierarchy

Map LangGraph's multi-agent patterns to BikiniBottom's hierarchy.

```python
# Register agents with parent-child relationship
manager = bb.agents.register(name="research-manager", level=7)
worker1 = bb.agents.register(name="web-researcher", parent_id=manager.id, level=3)
worker2 = bb.agents.register(name="paper-analyst", parent_id=manager.id, level=3)

# Manager creates sub-tasks
def manager_node(state):
    sub_tasks = break_down_task(state["task_description"])
    for sub in sub_tasks:
        bb.tasks.create(
            title=sub["title"],
            description=sub["description"],
            assignee_id=worker1.id if sub["type"] == "web" else worker2.id,
            parent_task_id=state["task_id"],
        )
    return state
```

## Pattern 4: Webhook-Triggered Graphs

Use BikiniBottom's outbound webhooks to trigger LangGraph execution.

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/webhook/task-assigned")
async def on_task_assigned(request: Request):
    payload = await request.json()
    task = payload["data"]

    # Run your LangGraph workflow
    result = langgraph_app.invoke({
        "task_id": task["id"],
        "task_description": task["description"],
    })

    return {"status": "ok"}
```

Then configure the webhook in BikiniBottom:
```
Event: task.assigned
URL: http://your-server:8000/webhook/task-assigned
```

## Best Practices

1. **Always check budget** before expensive LLM calls
2. **Report usage** after each LLM invocation for accurate tracking
3. **Use task rejection** when an agent can't handle a task (budget, capability, etc.)
4. **Map graph checkpoints** to BikiniBottom task status updates for visibility
5. **Use peer messaging** for agent-to-agent coordination within graphs

## Next Steps

- [Python SDK Reference](../sdk/python)
- [Task Workflow](../openspawn/TASK-WORKFLOW)
- [Credit System](../openspawn/CREDITS)
