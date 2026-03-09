"""Local mode entrypoint for openspawn start.

Boots FastAPI with SQLite backend, seeds from ORG.md, serves API.
Usage: openspawn-server [--project-dir /path/to/org]
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path

import structlog

logger = structlog.get_logger()


def build_local_config(project_dir: str) -> dict[str, str | int]:
    """Build configuration for local mode from openspawn.config.json."""
    project = Path(project_dir)
    config_path = project / "openspawn.config.json"
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


async def start_local(project_dir: str) -> None:
    """Boot FastAPI in local mode with SQLite."""
    import uvicorn

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

    logger.info(
        "local.starting",
        port=config["port"],
        database=config["database_url"],
        project_dir=project_dir,
    )

    # Start server
    uvicorn_config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=int(config["port"]),
        log_level="info",
    )
    server = uvicorn.Server(uvicorn_config)
    await server.serve()


def main() -> None:
    """CLI entrypoint for openspawn-server."""
    parser = argparse.ArgumentParser(description="OpenSpawn local server")
    parser.add_argument(
        "--project-dir",
        default=os.getcwd(),
        help="Project directory containing ORG.md and openspawn.config.json",
    )
    args = parser.parse_args()
    asyncio.run(start_local(args.project_dir))


if __name__ == "__main__":
    main()
