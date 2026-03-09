"""Tests for agent spawner."""

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.spawner.manager import SpawnManager
from app.spawner.process import build_mcp_config, find_claude_cli, spawn_claude_process
from app.spawner.prompt import build_bootstrap_prompt


def test_build_bootstrap_prompt_with_task():
    prompt = build_bootstrap_prompt(
        agent_name="Alice",
        soul_md="You are Alice, L8 engineering lead.",
        task_description="Fix the login bug",
    )
    assert "Alice" in prompt
    assert "Fix the login bug" in prompt
    assert "Identity" in prompt


def test_build_bootstrap_prompt_without_task():
    prompt = build_bootstrap_prompt(
        agent_name="Bob",
        soul_md="You are Bob, L4 worker.",
        task_description=None,
    )
    assert "Bob" in prompt
    assert "task_claim" in prompt


def test_build_bootstrap_prompt_includes_mcp_url():
    prompt = build_bootstrap_prompt(
        agent_name="Test",
        soul_md="test",
        mcp_url="http://custom:9999",
    )
    assert "http://custom:9999" in prompt


@pytest.mark.asyncio
async def test_spawn_manager_respects_cap():
    manager = SpawnManager(max_concurrent=2, dry_run=True)
    manager.enqueue("agent-1", "/tmp/ws1", "prompt1")
    manager.enqueue("agent-2", "/tmp/ws2", "prompt2")
    manager.enqueue("agent-3", "/tmp/ws3", "prompt3")
    assert manager.queued_count == 3
    assert manager.active_count == 0


@pytest.mark.asyncio
async def test_spawn_manager_drain_dry_run():
    manager = SpawnManager(max_concurrent=2, dry_run=True)
    manager.enqueue("agent-1", "/tmp/ws1", "prompt1")
    manager.enqueue("agent-2", "/tmp/ws2", "prompt2")
    manager.enqueue("agent-3", "/tmp/ws3", "prompt3")
    await manager.drain()
    # dry_run never adds to _active, so cap is never hit — all drain
    assert manager.queued_count == 0
    assert manager.active_count == 0


@pytest.mark.asyncio
async def test_spawn_manager_shutdown():
    manager = SpawnManager(max_concurrent=2, dry_run=True)
    await manager.shutdown()
    assert manager.active_count == 0
    assert manager.queued_count == 0


# --- process.py tests ---


def test_find_claude_cli_found():
    with patch("app.spawner.process.shutil.which", return_value="/usr/bin/claude"):
        assert find_claude_cli() == "/usr/bin/claude"


def test_find_claude_cli_missing():
    with (
        patch("app.spawner.process.shutil.which", return_value=None),
        pytest.raises(FileNotFoundError, match="Claude Code CLI not found"),
    ):
        find_claude_cli()


def test_build_mcp_config():
    config = build_mcp_config("http://localhost:8787")
    assert config == {
        "mcpServers": {
            "openspawn": {
                "url": "http://localhost:8787/mcp",
            }
        }
    }


def test_build_mcp_config_custom_url():
    config = build_mcp_config("https://api.openspawn.ai")
    assert config["mcpServers"]["openspawn"]["url"] == "https://api.openspawn.ai/mcp"


@pytest.mark.asyncio
async def test_spawn_claude_process_writes_mcp_config(tmp_path: Path):
    mock_proc = AsyncMock()
    with (
        patch("app.spawner.process.find_claude_cli", return_value="/usr/bin/claude"),
        patch(
            "app.spawner.process.asyncio.create_subprocess_exec",
            return_value=mock_proc,
        ) as mock_exec,
    ):
        result = await spawn_claude_process(
            agent_id="agent-1",
            workspace=str(tmp_path),
            prompt="do stuff",
            mcp_url="http://localhost:8787",
        )

    # Verify .mcp.json written with correct content
    mcp_json_path = tmp_path / ".mcp.json"
    assert mcp_json_path.exists()
    written = json.loads(mcp_json_path.read_text())
    assert written == build_mcp_config("http://localhost:8787")

    # Verify subprocess called with correct args
    mock_exec.assert_called_once()
    call_args = mock_exec.call_args
    positional = call_args[0]
    assert positional[0] == "/usr/bin/claude"
    assert "--print" in positional
    assert "--mcp-config" in positional
    assert str(mcp_json_path) in positional
    assert "-p" in positional
    assert "do stuff" in positional

    assert result is mock_proc
