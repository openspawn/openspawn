"""Local mode entrypoint for openspawn start.

Boots FastAPI with SQLite backend, seeds from ORG.md, serves API,
and spawns Claude Code agents from workspaces/.
Usage: openspawn-server [--project-dir /path/to/org]
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import signal
from pathlib import Path

import structlog

logger = structlog.get_logger()


def build_local_config(project_dir: str) -> dict[str, str | int]:
    """Build configuration for local mode from openspawn.json."""
    project = Path(project_dir)
    config_path = project / "openspawn.json"
    db_dir = project / ".openspawn"
    db_dir.mkdir(parents=True, exist_ok=True)
    db_path = db_dir / "openspawn.db"

    user_config: dict[str, object] = {}
    if config_path.exists():
        user_config = json.loads(config_path.read_text())

    coordinator = user_config.get("coordinator", {})
    port = coordinator.get("port", 8787) if isinstance(coordinator, dict) else 8787
    org_file = user_config.get("orgFile", "ORG.md")

    return {
        "database_url": f"sqlite+aiosqlite:///{db_path}",
        "port": int(port),
        "project_dir": project_dir,
        "org_file": str(project / str(org_file)),
    }


def resolve_agents_to_spawn(project_dir: str) -> list[dict[str, str]]:
    """Scan workspaces/ for agent directories with SOUL.md."""
    workspaces = Path(project_dir) / "workspaces"
    if not workspaces.exists():
        return []

    agents: list[dict[str, str]] = []
    for ws_dir in sorted(workspaces.iterdir()):
        if not ws_dir.is_dir():
            continue
        soul_path = ws_dir / "SOUL.md"
        if not soul_path.exists():
            continue
        agents.append(
            {
                "name": ws_dir.name,
                "workspace": str(ws_dir),
                "soul_md": soul_path.read_text(),
            }
        )
    return agents


async def start_local(project_dir: str) -> None:
    """Boot FastAPI in local mode with SQLite, then spawn agents."""
    import uvicorn

    from app.spawner import SpawnManager, build_bootstrap_prompt
    from app.workers.local_scheduler import LocalScheduler

    config = build_local_config(project_dir)

    # Set environment for the app
    os.environ["DATABASE_URL"] = str(config["database_url"])
    os.environ.setdefault("CORS_ORIGINS", "http://localhost:4200")

    # Reload modules to pick up new env
    from importlib import reload

    import app.config

    reload(app.config)
    import app.database

    reload(app.database)

    # Create tables (no Alembic for SQLite)
    from app.database import create_tables

    await create_tables()

    # Seed agents from ORG.md (if seeder exists and org file exists)
    org_path = str(config["org_file"])
    if os.path.exists(org_path):
        try:
            from app.seeder import seed_from_org

            count = await seed_from_org(org_path)
            logger.info("seeder.complete", agents=count)
        except ImportError:
            logger.warning("seeder not available, skipping ORG.md import")

    # Set up background enrichment scheduler (replaces arq + Redis)
    scheduler = LocalScheduler()
    try:
        from app.workers.enrichment import (
            boost_co_retrieved,
            extract_entities,
            identify_stale,
        )
        from app.workers.expiry import expire_memories

        scheduler.add_job(boost_co_retrieved, interval_seconds=6 * 3600, name="boost_co_retrieved")
        scheduler.add_job(identify_stale, interval_seconds=24 * 3600, name="identify_stale")
        scheduler.add_job(extract_entities, interval_seconds=3600, name="extract_entities")
        scheduler.add_job(expire_memories, interval_seconds=3600, name="expire_memories")
    except ImportError:
        logger.warning("enrichment workers not available, skipping scheduler")
    try:
        from app.workers.approval_expiry import expire_approvals

        scheduler.add_job(expire_approvals, interval_seconds=300, name="expire_approvals")
    except ImportError:
        logger.warning("approval_expiry worker not available, skipping")
    try:
        from app.coordination.sla_monitor import monitor_sla

        scheduler.add_job(monitor_sla, interval_seconds=60, name="monitor_sla")
    except ImportError:
        logger.warning("sla_monitor not available, skipping")

    # Read user config for spawning settings
    config_path = Path(project_dir) / "openspawn.json"
    user_config: dict[str, object] = {}
    if config_path.exists():
        user_config = json.loads(config_path.read_text())

    spawning = user_config.get("spawning", {})
    max_concurrent = spawning.get("maxConcurrentAgents", 2) if isinstance(spawning, dict) else 2

    # Prepare spawn manager
    manager = SpawnManager(max_concurrent=int(max_concurrent))
    agents = resolve_agents_to_spawn(project_dir)

    port = int(config["port"])
    for agent in agents:
        prompt = build_bootstrap_prompt(
            agent_name=agent["name"],
            soul_md=agent["soul_md"],
            mcp_url=f"http://localhost:{port}",
        )
        manager.enqueue(agent["name"], agent["workspace"], prompt)

    logger.info(
        "local.starting",
        port=port,
        database=config["database_url"],
        project_dir=project_dir,
        agents=len(agents),
        max_concurrent=max_concurrent,
    )

    # Start server
    uvicorn_config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
    server = uvicorn.Server(uvicorn_config)

    async def spawn_after_ready() -> None:
        """Poll for server readiness, then drain the spawn queue."""
        # uvicorn.Server.started is a plain bool — no event to await
        while not server.started:  # noqa: ASYNC110
            await asyncio.sleep(0.5)
        # Extra delay to ensure connections accepted
        await asyncio.sleep(1)
        logger.info("spawner.draining", agents=manager.queued_count)
        await manager.drain()

    # Handle signals for graceful shutdown
    _shutdown_tasks: set[asyncio.Task[None]] = set()

    def _shutdown() -> None:
        scheduler.stop()
        t = asyncio.create_task(manager.shutdown())
        _shutdown_tasks.add(t)
        t.add_done_callback(_shutdown_tasks.discard)

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown)

    # Run server, spawner, and scheduler concurrently
    spawn_task: asyncio.Task[None] | None = None
    if agents:
        spawn_task = asyncio.create_task(spawn_after_ready())

    scheduler_task: asyncio.Task[None] | None = None
    if scheduler._jobs:
        scheduler_task = asyncio.create_task(scheduler.start())

    await server.serve()

    # Cleanup background tasks
    scheduler.stop()
    if scheduler_task and not scheduler_task.done():
        scheduler_task.cancel()
    if spawn_task and not spawn_task.done():
        spawn_task.cancel()


def main() -> None:
    """CLI entrypoint for openspawn-server."""
    parser = argparse.ArgumentParser(description="OpenSpawn local server")
    parser.add_argument(
        "--project-dir",
        default=os.getcwd(),
        help="Project directory containing ORG.md and openspawn.json",
    )
    args = parser.parse_args()
    asyncio.run(start_local(args.project_dir))


if __name__ == "__main__":
    main()
