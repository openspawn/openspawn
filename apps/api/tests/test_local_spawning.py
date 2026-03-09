"""Tests for agent spawning in local mode."""

from pathlib import Path

from app.local import resolve_agents_to_spawn


def test_resolve_agents_finds_workspaces(tmp_path: Path) -> None:
    ws = tmp_path / "workspaces" / "alice"
    ws.mkdir(parents=True)
    (ws / "SOUL.md").write_text("You are Alice, L8 lead.")

    agents = resolve_agents_to_spawn(str(tmp_path))
    assert len(agents) == 1
    assert agents[0]["name"] == "alice"
    assert "Alice" in agents[0]["soul_md"]


def test_resolve_agents_skips_dirs_without_soul(tmp_path: Path) -> None:
    ws = tmp_path / "workspaces" / "empty-agent"
    ws.mkdir(parents=True)

    agents = resolve_agents_to_spawn(str(tmp_path))
    assert len(agents) == 0


def test_resolve_agents_handles_no_workspaces_dir(tmp_path: Path) -> None:
    agents = resolve_agents_to_spawn(str(tmp_path))
    assert len(agents) == 0


def test_resolve_agents_multiple(tmp_path: Path) -> None:
    for name in ["alice", "bob", "carol"]:
        ws = tmp_path / "workspaces" / name
        ws.mkdir(parents=True)
        (ws / "SOUL.md").write_text(f"You are {name}.")

    agents = resolve_agents_to_spawn(str(tmp_path))
    assert len(agents) == 3
    assert [a["name"] for a in agents] == ["alice", "bob", "carol"]


def test_resolve_agents_skips_files_in_workspaces(tmp_path: Path) -> None:
    workspaces = tmp_path / "workspaces"
    workspaces.mkdir(parents=True)
    (workspaces / "README.md").write_text("not an agent")

    ws = workspaces / "alice"
    ws.mkdir()
    (ws / "SOUL.md").write_text("You are Alice.")

    agents = resolve_agents_to_spawn(str(tmp_path))
    assert len(agents) == 1
    assert agents[0]["name"] == "alice"
