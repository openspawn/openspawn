"""Tests for local mode entrypoint."""

import json
from pathlib import Path

from app.local import build_local_config


def test_build_local_config_defaults(tmp_path: Path) -> None:
    config = build_local_config(str(tmp_path))
    assert "sqlite" in config["database_url"]
    assert config["port"] == 8787
    assert str(config["org_file"]).endswith("ORG.md")


def test_build_local_config_custom_port(tmp_path: Path) -> None:
    config_file = tmp_path / "openspawn.config.json"
    config_file.write_text(json.dumps({"coordinator": {"port": 9999}}))
    config = build_local_config(str(tmp_path))
    assert config["port"] == 9999


def test_build_local_config_custom_org_file(tmp_path: Path) -> None:
    config_file = tmp_path / "openspawn.config.json"
    config_file.write_text(json.dumps({"orgFile": "team/AGENTS.md"}))
    config = build_local_config(str(tmp_path))
    assert str(config["org_file"]).endswith("team/AGENTS.md")


def test_build_local_config_creates_db_dir(tmp_path: Path) -> None:
    build_local_config(str(tmp_path))
    assert (tmp_path / ".openspawn").is_dir()


def test_build_local_config_db_path(tmp_path: Path) -> None:
    config = build_local_config(str(tmp_path))
    db_url = str(config["database_url"])
    assert db_url.endswith(".openspawn/openspawn.db")
