"""Agent spawner — manages Claude Code CLI subprocesses with concurrency control."""

from app.spawner.manager import SpawnManager
from app.spawner.prompt import build_bootstrap_prompt

__all__ = ["SpawnManager", "build_bootstrap_prompt"]
