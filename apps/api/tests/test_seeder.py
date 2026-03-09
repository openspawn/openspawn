"""Tests for ORG.md parser and database seeder."""

from __future__ import annotations

import os
import textwrap
from importlib import reload
from unittest.mock import patch

import pytest
from sqlalchemy import select

from app.seeder import parse_org_md_content


# ---------------------------------------------------------------------------
# Pure parsing tests (no DB required)
# ---------------------------------------------------------------------------


class TestTableParser:
    """Tests for the table-based ORG.md format."""

    def test_basic_table(self) -> None:
        md = textwrap.dedent("""\
            # My Agent Team

            ## Agents

            | Name | Role | Level | Domain | Reports To |
            |------|------|-------|--------|------------|
            | Alice | lead | 8 | engineering | — |
            | Bob | worker | 4 | engineering | Alice |
            | Carol | worker | 5 | design | Alice |
        """)
        agents = parse_org_md_content(md)
        assert len(agents) == 3

        alice = agents[0]
        assert alice["name"] == "Alice"
        assert alice["agent_id"] == "alice"
        assert alice["level"] == 8
        assert alice["domain"] == "engineering"
        assert alice["parent_agent_id"] is None

        bob = agents[1]
        assert bob["name"] == "Bob"
        assert bob["level"] == 4
        assert bob["parent_agent_id"] == "alice"

        carol = agents[2]
        assert carol["name"] == "Carol"
        assert carol["level"] == 5
        assert carol["domain"] == "design"

    def test_missing_reports_to_dash(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Name | Role | Level | Domain | Reports To |
            |------|------|-------|--------|------------|
            | Root | lead | 10 | ops | — |
            | Sub | worker | 3 | ops | - |
        """)
        agents = parse_org_md_content(md)
        assert agents[0]["parent_agent_id"] is None
        assert agents[1]["parent_agent_id"] is None

    def test_empty_reports_to(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Name | Role | Level | Domain | Reports To |
            |------|------|-------|--------|------------|
            | Solo | worker | 4 | eng |  |
        """)
        agents = parse_org_md_content(md)
        assert agents[0]["parent_agent_id"] is None

    def test_different_column_order(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Level | Reports To | Name | Domain | Role |
            |-------|------------|------|--------|------|
            | 7 | — | Zoe | research | lead |
            | 3 | Zoe | Max | research | worker |
        """)
        agents = parse_org_md_content(md)
        assert len(agents) == 2
        assert agents[0]["name"] == "Zoe"
        assert agents[0]["level"] == 7
        assert agents[1]["parent_agent_id"] == "zoe"

    def test_extra_whitespace(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Name  |  Role  |  Level |  Domain  |  Reports To  |
            |-------|--------|--------|----------|--------------|
            |  Alice  |  lead  |  8  |  eng  |  —  |
            |  Bob  |  worker  |  4  |  eng  |  Alice  |
        """)
        agents = parse_org_md_content(md)
        assert len(agents) == 2
        assert agents[0]["name"] == "Alice"
        assert agents[0]["domain"] == "eng"
        assert agents[1]["parent_agent_id"] == "alice"

    def test_level_clamped(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Name | Role | Level | Domain | Reports To |
            |------|------|-------|--------|------------|
            | High | lead | 15 | ops | — |
            | Low | worker | 0 | ops | High |
        """)
        agents = parse_org_md_content(md)
        assert agents[0]["level"] == 10
        assert agents[1]["level"] == 1

    def test_level_inferred_when_missing(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Agents

            | Name | Role | Domain | Reports To |
            |------|------|--------|------------|
            | Sam | worker | eng | — |
        """)
        agents = parse_org_md_content(md)
        assert agents[0]["level"] == 4  # default inferred


class TestSectionParser:
    """Tests for the section-based ORG.md format (TS-compatible)."""

    def test_basic_structure(self) -> None:
        md = textwrap.dedent("""\
            # Test Org

            ## Structure

            ### Alice — Lead

            - **Level:** 8
            - **Domain:** engineering

            ### Engineering

            #### Bob — Senior Engineer

            - **Level:** 6
            - **Domain:** engineering
            - **Reports To:** Alice
        """)
        agents = parse_org_md_content(md)
        assert len(agents) == 2

        alice = agents[0]
        assert alice["name"] == "Alice"
        assert alice["level"] == 8
        assert alice["domain"] == "engineering"

        bob = agents[1]
        assert bob["name"] == "Bob"
        assert bob["parent_agent_id"] == "alice"

    def test_count_expansion(self) -> None:
        md = textwrap.dedent("""\
            # Org

            ## Structure

            ### Runner — Worker

            - **Level:** 4
            - **Domain:** delivery
            - **Count:** 3
        """)
        agents = parse_org_md_content(md)
        assert len(agents) == 3
        assert agents[0]["agent_id"] == "runner-1"
        assert agents[0]["name"] == "Runner 1"
        assert agents[2]["agent_id"] == "runner-3"

    def test_empty_org(self) -> None:
        md = textwrap.dedent("""\
            # Empty Org

            ## Culture

            - **Preset:** professional
        """)
        agents = parse_org_md_content(md)
        assert agents == []


# ---------------------------------------------------------------------------
# Database seeding tests (SQLite)
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def sqlite_env(tmp_path):
    """Point DATABASE_URL at a temp SQLite file and disable Redis."""
    db_path = tmp_path / "test_seeder.db"
    env = {
        "DATABASE_URL": f"sqlite+aiosqlite:///{db_path}",
        "REDIS_URL": "",
    }
    with patch.dict(os.environ, env, clear=False):
        import app.config
        import app.database

        reload(app.config)
        reload(app.database)
        yield


@pytest.fixture
async def db_session():
    """Create tables and yield a session."""
    from app.database import async_session, create_tables

    await create_tables()

    async with async_session() as session:
        yield session


@pytest.mark.asyncio
async def test_seed_inserts_agents(db_session, tmp_path) -> None:
    """Seeding from a table-format ORG.md inserts agents."""
    from app.models.agent import Agent
    from app.models.organization import Organization
    from app.seeder import seed_from_org

    org_md = tmp_path / "ORG.md"
    org_md.write_text(
        textwrap.dedent("""\
        # Test Org

        ## Agents

        | Name | Role | Level | Domain | Reports To |
        |------|------|-------|--------|------------|
        | Alice | lead | 8 | engineering | — |
        | Bob | worker | 4 | engineering | Alice |
    """)
    )

    count = await seed_from_org(str(org_md), session=db_session)
    assert count == 2

    # Verify org was created
    result = await db_session.execute(select(Organization).where(Organization.slug == "test-org"))
    org = result.scalar_one()
    assert org.name == "Test Org"

    # Verify agents
    result = await db_session.execute(
        select(Agent).where(Agent.org_id == org.id).order_by(Agent.level.desc())
    )
    agents = result.scalars().all()
    assert len(agents) == 2

    alice = next(a for a in agents if a.agent_id == "alice")
    bob = next(a for a in agents if a.agent_id == "bob")
    assert alice.level == 8
    assert bob.parent_id == alice.id


@pytest.mark.asyncio
async def test_seed_upserts_on_rerun(db_session, tmp_path) -> None:
    """Running seed twice updates existing agents instead of duplicating."""
    from app.models.agent import Agent
    from app.seeder import seed_from_org

    org_md = tmp_path / "ORG.md"
    org_md.write_text(
        textwrap.dedent("""\
        # Upsert Org

        ## Agents

        | Name | Role | Level | Domain | Reports To |
        |------|------|-------|--------|------------|
        | Alice | lead | 8 | eng | — |
    """)
    )

    count1 = await seed_from_org(str(org_md), session=db_session)
    assert count1 == 1

    # Modify and re-seed
    org_md.write_text(
        textwrap.dedent("""\
        # Upsert Org

        ## Agents

        | Name | Role | Level | Domain | Reports To |
        |------|------|-------|--------|------------|
        | Alice | lead | 9 | eng | — |
    """)
    )

    count2 = await seed_from_org(str(org_md), session=db_session)
    assert count2 == 1

    # Should still be one agent, with updated level
    result = await db_session.execute(select(Agent))
    agents = result.scalars().all()
    assert len(agents) == 1
    assert agents[0].level == 9


@pytest.mark.asyncio
async def test_seed_section_format(db_session, tmp_path) -> None:
    """Seeding from a section-format ORG.md inserts agents."""
    from app.models.agent import Agent
    from app.seeder import seed_from_org

    org_md = tmp_path / "ORG.md"
    org_md.write_text(
        textwrap.dedent("""\
        # Section Org

        ## Structure

        ### Boss — Owner

        - **Level:** 10
        - **Domain:** operations

        ### Engineering

        #### Dev — Senior Engineer

        - **Level:** 6
        - **Domain:** engineering
        - **Reports To:** Boss
    """)
    )

    count = await seed_from_org(str(org_md), session=db_session)
    assert count == 2

    result = await db_session.execute(select(Agent).order_by(Agent.level.desc()))
    agents = result.scalars().all()
    assert len(agents) == 2

    boss = next(a for a in agents if a.agent_id == "boss")
    dev = next(a for a in agents if a.agent_id == "dev")
    assert boss.level == 10
    assert dev.parent_id == boss.id
