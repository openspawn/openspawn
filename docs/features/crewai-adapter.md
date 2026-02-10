---
title: CrewAI Adapter
layout: default
parent: Features
nav_order: 13
---

# 🚢 CrewAI + BikiniBottom

Map CrewAI's crew/agent/task model directly onto BikiniBottom's coordination infrastructure.

## Overview

CrewAI concepts map naturally to BikiniBottom:

| CrewAI | BikiniBottom | Notes |
|--------|-------------|-------|
| **Crew** | **Team** | Organizational unit with a lead |
| **Agent** | **Agent** | Registered with level, role, capabilities |
| **Task** | **Task** | Persisted, tracked, with credit costs |
| **Process** | **Orchestrator Mode** | Sequential or hierarchical routing |
| **Memory** | **Event Log** | Full audit trail of all actions |

## Setup

```bash
pip install openspawn crewai
```

## Pattern 1: Crew as a BikiniBottom Team

Register your CrewAI agents with BikiniBottom for persistent tracking.

```python
from openspawn import OpenSpawnClient
from crewai import Agent, Task, Crew, Process

bb = OpenSpawnClient(base_url="http://localhost:3000", api_key="your-key")

# Register agents in BikiniBottom (do once)
researcher_bb = bb.agents.register(
    name="Researcher",
    role="WORKER",
    level=5,
    model="gpt-4",
    team_id="team-epd",
)
writer_bb = bb.agents.register(
    name="Writer",
    role="WORKER",
    level=5,
    model="gpt-4",
    team_id="team-content",
)

# Create CrewAI agents as usual
researcher = Agent(
    role="Senior Researcher",
    goal="Find comprehensive information",
    backstory="Expert researcher with years of experience",
    verbose=True,
)

writer = Agent(
    role="Technical Writer",
    goal="Write clear, engaging content",
    backstory="Experienced technical writer",
    verbose=True,
)
```

## Pattern 2: BikiniBottom-Tracked Tasks

Wrap CrewAI task execution with BikiniBottom tracking.

```python
def run_crew_with_tracking(topic: str):
    # Create task in BikiniBottom for tracking
    bb_task = bb.tasks.create(
        title=f"Research and write about: {topic}",
        description=f"Full research and article on {topic}",
        assignee_id=researcher_bb.id,
        priority="NORMAL",
    )

    # Define CrewAI tasks
    research_task = Task(
        description=f"Research {topic} thoroughly",
        expected_output="Comprehensive research notes",
        agent=researcher,
    )

    write_task = Task(
        description=f"Write an article about {topic} based on research",
        expected_output="Polished article",
        agent=writer,
    )

    # Run the crew
    crew = Crew(
        agents=[researcher, writer],
        tasks=[research_task, write_task],
        process=Process.sequential,
        verbose=True,
    )

    try:
        result = crew.kickoff()

        # Report success to BikiniBottom
        bb.tasks.complete(bb_task.id, result=str(result))
        bb.credits.report_usage(
            agent_id=researcher_bb.id,
            tokens_used=2000,
            model="gpt-4",
        )
        bb.credits.report_usage(
            agent_id=writer_bb.id,
            tokens_used=1500,
            model="gpt-4",
        )
        return result

    except Exception as e:
        bb.tasks.reject(bb_task.id, reason=str(e))
        raise
```

## Pattern 3: Budget-Gated Crew Execution

Check team budget before kicking off expensive crews.

```python
def run_if_budget_allows(topic: str, min_budget: int = 1000):
    """Only run the crew if the team has sufficient budget."""
    researcher_agent = bb.agents.get(researcher_bb.id)
    writer_agent = bb.agents.get(writer_bb.id)

    total_budget = researcher_agent.current_balance + writer_agent.current_balance

    if total_budget < min_budget:
        print(f"⚠️ Insufficient budget: {total_budget} < {min_budget}")
        return None

    return run_crew_with_tracking(topic)
```

## Pattern 4: Hierarchical Process with BikiniBottom

Map CrewAI's hierarchical process to BikiniBottom's agent hierarchy.

```python
# Register manager agent
manager_bb = bb.agents.register(
    name="Research Manager",
    role="MANAGER",
    level=7,
    model="gpt-4",
)

# Workers report to manager
researcher_bb = bb.agents.register(
    name="Researcher",
    parent_id=manager_bb.id,
    level=5,
)

# Use hierarchical process
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.hierarchical,
    manager_llm="gpt-4",
    verbose=True,
)
```

## Pattern 5: Webhook-Triggered Crews

Trigger crew execution from external events via BikiniBottom webhooks.

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/webhook/new-task")
async def handle_new_task(request: Request):
    payload = await request.json()
    task_data = payload["data"]

    # Spin up a crew for this task
    result = run_crew_with_tracking(task_data["description"])

    return {"status": "completed", "result": str(result)}
```

## CrewAI Callbacks → BikiniBottom Events

Track crew progress in real-time:

```python
from crewai.callbacks import BaseCallbackHandler

class BikiniBottomCallback(BaseCallbackHandler):
    def on_task_start(self, task):
        bb.events.log(
            type="TASK_STARTED",
            agent_id=self.current_agent_id,
            entity_type="TASK",
            entity_id=self.bb_task_id,
        )

    def on_task_end(self, task, output):
        bb.events.log(
            type="TASK_COMPLETED",
            agent_id=self.current_agent_id,
            entity_type="TASK",
            entity_id=self.bb_task_id,
            reasoning=str(output)[:500],
        )
```

## Best Practices

1. **Register agents once**, reuse IDs across crew executions
2. **Track token usage** per agent for accurate cost allocation
3. **Use teams** to group related CrewAI agents
4. **Set budget limits** to prevent runaway crew costs
5. **Log events** at each step for full auditability in the dashboard

## Next Steps

- [Python SDK Reference](../sdk/python)
- [Agent Hierarchy](../openspawn/AGENT-LIFECYCLE)
- [Trust & Reputation](../case-studies/trust-reputation)
