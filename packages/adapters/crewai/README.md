# openspawn-crewai

OpenSpawn adapter for [CrewAI](https://crewai.com) — report crew activity to OpenSpawn infrastructure for coordination, task tracking, and memory.

## Installation

```bash
pip install openspawn-crewai crewai
```

## Quick Start

```python
from crewai import Agent, Task, Crew
from openspawn import OpenSpawnClient
from openspawn_crewai import OpenSpawnCrew

# Create your CrewAI crew as usual
researcher = Agent(role="Researcher", goal="Find information", backstory="...")
writer = Agent(role="Writer", goal="Write reports", backstory="...")

task1 = Task(description="Research AI trends", agent=researcher, expected_output="Summary")
task2 = Task(description="Write a report", agent=writer, expected_output="Report")

crew = Crew(agents=[researcher, writer], tasks=[task1, task2])

# Wrap with OpenSpawn
client = OpenSpawnClient(
    api_url="https://api.openspawn.ai",
    agent_id="my-orchestrator",
    hmac_secret="your-hmac-secret",
)

os_crew = OpenSpawnCrew(crew, client)
result = os_crew.kickoff(inputs={"topic": "AI in 2025"})
```

## What Gets Reported

| CrewAI Event | OpenSpawn Action |
|---|---|
| Crew starts | Agents registered, tasks created, transitions to in-progress |
| Crew completes | Tasks transitioned to done, result stored as memory, completion event emitted |
| Crew fails | Tasks transitioned to blocked, failure event emitted |

## Options

```python
OpenSpawnCrew(
    crew,
    client,
    auto_register=True,          # Register agents in OpenSpawn (default: True)
    default_priority="high",     # Task priority (default: "normal")
    agent_level=5,               # Agent level in hierarchy (default: 5)
    store_output_as_memory=True, # Store crew output as memory (default: True)
)
```

## Fine-Grained Callbacks

For per-task lifecycle hooks:

```python
from openspawn_crewai import OpenSpawnTaskCallback

callback = OpenSpawnTaskCallback(client, task_id="openspawn-task-uuid")
callback.on_task_start(task)
callback.on_task_complete(task, output)
callback.on_task_error(task, error)
```

## License

MIT
