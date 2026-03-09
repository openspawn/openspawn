"""Bootstrap prompt builder for Claude Code agent processes."""

from __future__ import annotations


def build_bootstrap_prompt(
    agent_name: str,
    soul_md: str,
    task_description: str | None = None,
    mcp_url: str = "http://localhost:8787",
) -> str:
    """Build the -p prompt for a Claude Code subprocess."""
    parts = [
        f"You are {agent_name}.",
        "",
        "## Your Identity (SOUL.md)",
        "",
        soul_md,
        "",
        "## Instructions",
        "",
        f"You have access to MCP tools via the OpenSpawn coordinator at {mcp_url}.",
        "Use these tools to coordinate with your team:",
        "- task_claim: claim the next available task",
        "- task_update: report progress",
        "- report: report completion",
        "- delegate: delegate subtasks to lower-level agents",
        "- escalate: escalate blockers to your manager",
        "- memory_store: save important learnings",
        "- memory_search: recall organizational knowledge",
        "",
    ]

    if task_description:
        parts.extend(
            [
                "## Your Current Task",
                "",
                task_description,
                "",
                "Complete this task, then report completion via the report tool.",
            ]
        )
    else:
        parts.extend(
            [
                "## Getting Started",
                "",
                "Use task_claim to get your next task from the queue.",
                "If no tasks are available, report that you are idle.",
            ]
        )

    return "\n".join(parts)
