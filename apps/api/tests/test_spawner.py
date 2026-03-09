"""Tests for agent spawner."""

import pytest

from app.spawner.manager import SpawnManager
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
