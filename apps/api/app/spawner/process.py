"""Claude Code CLI subprocess management."""

from __future__ import annotations

import asyncio
import json
import shutil
from pathlib import Path

import structlog

logger = structlog.get_logger()


def find_claude_cli() -> str:
    """Find the claude CLI binary."""
    path = shutil.which("claude")
    if not path:
        raise FileNotFoundError(
            "Claude Code CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code"
        )
    return path


def build_mcp_config(mcp_url: str) -> dict[str, object]:
    """Build MCP client config for a Claude Code subprocess."""
    return {
        "mcpServers": {
            "openspawn": {
                "url": f"{mcp_url}/mcp",
            }
        }
    }


async def spawn_claude_process(
    agent_id: str,
    workspace: str,
    prompt: str,
    mcp_url: str = "http://localhost:8787",
) -> asyncio.subprocess.Process:
    """Spawn a Claude Code CLI subprocess for an agent."""
    claude = find_claude_cli()

    # Write MCP config to workspace
    mcp_config_path = Path(workspace) / ".mcp.json"
    mcp_config = build_mcp_config(mcp_url)
    mcp_config_path.write_text(json.dumps(mcp_config, indent=2))

    cmd = [
        claude,
        "--print",
        "--mcp-config",
        str(mcp_config_path),
        "-p",
        prompt,
    ]

    logger.info("spawn.starting", agent=agent_id, workspace=workspace)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=workspace,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    return proc
