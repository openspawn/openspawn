"""ORG.md parser and database seeder.

Reads an ORG.md file (section-based or table-based format) and upserts
agents into the database. Used during `openspawn start` to bootstrap
the agent hierarchy from a declarative org definition.
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import TYPE_CHECKING

from sqlalchemy import select

from app.models.agent import Agent
from app.models.enums import AgentMode, AgentRole, AgentStatus
from app.models.organization import Organization

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _make_id(name: str) -> str:
    """Slugify a name into a stable agent_id."""
    return _SLUG_RE.sub("-", name.lower()).strip("-")


def _name_from_heading(heading: str) -> str:
    """Extract the display name from a heading like 'Alice — Lead'."""
    idx = heading.find(" — ")
    if idx < 0:
        idx = heading.find(" - ")
    return heading[:idx].strip() if idx > 0 else heading.strip()


def _infer_level_and_role(name: str) -> tuple[int, str]:
    """Infer level + role label from a heading/name string."""
    n = name.lower()
    if re.search(r"\b(coo|cto|ceo|owner|founder)\b", n):
        return 10, "executive"
    if re.search(r"\b(cfo|vp|director|talent)\b", n):
        return 9, "director"
    if re.search(r"\b(head|lead|manager)\b", n):
        return 7, "lead"
    if re.search(r"\b(senior|principal)\b", n):
        return 6, "senior"
    if re.search(r"\b(junior|intern|assistant)\b", n):
        return 1, "intern"
    return 4, "worker"


def _map_role_to_enum(role_label: str) -> AgentRole:
    """Map an ORG.md role label to an AgentRole enum value."""
    label = role_label.lower().strip()
    if label in ("founder", "executive", "owner"):
        return AgentRole.FOUNDER
    if label in ("admin", "director"):
        return AgentRole.ADMIN
    if label in ("hr",):
        return AgentRole.HR
    return AgentRole.WORKER


def _map_role_to_mode(role_label: str, level: int) -> AgentMode:
    """Derive AgentMode from role/level."""
    label = role_label.lower().strip()
    if label in ("executive", "founder", "owner", "director", "lead", "manager") or level >= 7:
        return AgentMode.ORCHESTRATOR
    return AgentMode.WORKER


def _generate_hmac_bytes() -> bytes:
    """Generate placeholder HMAC secret bytes for seeded agents."""
    return os.urandom(32)


def _extract_meta(lines: list[str]) -> dict[str, str]:
    """Extract key-value pairs from markdown list items like '- **Key:** Value'."""
    meta: dict[str, str] = {}
    for line in lines:
        m = re.match(r"^[-*]\s+\*{0,2}([^*]+?)\*{0,2}:\*{0,2}\s*(.+)$", line)
        if m:
            key = re.sub(r"[\s-]+", "_", m.group(1).strip().lower())
            meta[key] = m.group(2).strip()
    return meta


# ---------------------------------------------------------------------------
# Table-format parser
# ---------------------------------------------------------------------------


def _parse_table(lines: list[str]) -> list[dict[str, str]]:
    """Parse a markdown table into a list of row dicts.

    Handles any column order. The separator row (|---|---|) is skipped.
    """
    # Find header row
    header_idx: int | None = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("|") and not re.match(r"^\|[\s\-:|]+\|$", stripped):
            header_idx = i
            break

    if header_idx is None:
        return []

    header_line = lines[header_idx]
    headers = [
        h.strip().lower().replace(" ", "_") for h in header_line.strip().strip("|").split("|")
    ]

    rows: list[dict[str, str]] = []
    for line in lines[header_idx + 1 :]:
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        # Skip separator row
        if re.match(r"^\|[\s\-:|]+\|$", stripped):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        row: dict[str, str] = {}
        for j, header in enumerate(headers):
            row[header] = cells[j] if j < len(cells) else ""
        rows.append(row)

    return rows


def _agents_from_table(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    """Convert table rows to agent dicts."""
    agents: list[dict[str, object]] = []
    for row in rows:
        name = row.get("name", "").strip()
        if not name:
            continue

        role_label = row.get("role", "worker").strip()
        level_str = row.get("level", "")
        domain = row.get("domain", "").strip() or None
        reports_to = row.get("reports_to", "").strip()

        level = int(level_str) if level_str.isdigit() else _infer_level_and_role(name)[0]

        # Normalize empty/dash reports_to
        parent_agent_id: str | None = None
        if reports_to and reports_to not in ("\u2014", "-", "\u2013", "none", ""):
            parent_agent_id = _make_id(reports_to)

        agents.append(
            {
                "agent_id": _make_id(name),
                "name": name,
                "role_label": role_label,
                "level": max(1, min(10, level)),
                "domain": domain,
                "parent_agent_id": parent_agent_id,
                "model": row.get("model", "").strip() or "sonnet",
                "status": "active",
            }
        )
    return agents


# ---------------------------------------------------------------------------
# Section-format parser (mirrors TS org-parser)
# ---------------------------------------------------------------------------


def _parse_sections(text: str) -> list[dict[str, object]]:
    """Parse the section-based ORG.md format used by existing org definitions."""

    class Section:
        def __init__(self, heading: str, level: int) -> None:
            self.heading = heading
            self.level = level
            self.lines: list[str] = []
            self.children: list[Section] = []

    lines = text.split("\n")
    root: list[Section] = []
    stack: list[Section] = []

    for line in lines:
        m = re.match(r"^(#{1,6})\s+(.+)$", line)
        if m:
            lvl = len(m.group(1))
            heading = m.group(2).strip()
            section = Section(heading, lvl)
            while stack and stack[-1].level >= lvl:
                stack.pop()
            if stack:
                stack[-1].children.append(section)
            else:
                root.append(section)
            stack.append(section)
        elif stack:
            stack[-1].lines.append(line)

    # Find top-level section
    h1 = next((s for s in root if s.level == 1), None)
    h2_sections = h1.children if h1 else [s for s in root if s.level == 2]

    # Find Structure section
    structure = next((s for s in h2_sections if "structure" in s.heading.lower()), None)
    if not structure:
        return []

    agents: list[dict[str, object]] = []

    for dept in structure.children:
        if dept.level != 3:
            continue

        meta = _extract_meta(dept.lines)
        display_name = _name_from_heading(dept.heading)
        inferred_level, inferred_role = _infer_level_and_role(dept.heading)

        dept_level = int(meta.get("level", str(inferred_level)))
        is_c_level = dept_level >= 10

        if is_c_level or not dept.children:
            agent_id = _make_id(meta.get("id", display_name))
            domain = meta.get("domain", dept.heading)
            reports_to_raw = meta.get("reports_to", "")
            parent_agent_id = _make_id(reports_to_raw) if reports_to_raw else None
            count = int(meta.get("count", "1") or "1")

            for i in range(count):
                a_name = f"{display_name} {i + 1}" if count > 1 else display_name
                a_id = f"{agent_id}-{i + 1}" if count > 1 else agent_id

                agents.append(
                    {
                        "agent_id": a_id,
                        "name": a_name,
                        "role_label": inferred_role,
                        "level": max(1, min(10, dept_level)),
                        "domain": domain,
                        "parent_agent_id": parent_agent_id,
                        "model": meta.get("model", "sonnet"),
                        "status": "active",
                    }
                )
            continue

        # Department with sub-roles
        dept_lead_id: str | None = None

        for ri, sub in enumerate(dept.children):
            if sub.level != 4:
                continue

            sub_meta = _extract_meta(sub.lines)
            sub_name = _name_from_heading(sub.heading)
            sub_inferred_level, sub_inferred_role = _infer_level_and_role(sub.heading)
            sub_level = int(sub_meta.get("level", str(sub_inferred_level)))

            sub_id = _make_id(sub_meta.get("id", sub_name))
            domain = sub_meta.get("domain", dept.heading)
            count = int(sub_meta.get("count", "1") or "1")

            reports_to_raw = sub_meta.get("reports_to", "")
            if reports_to_raw:
                parent_agent_id = _make_id(reports_to_raw)
            elif ri == 0:
                # First sub-role in dept — reports to top-level if any
                parent_agent_id = agents[-1]["agent_id"] if agents else None  # type: ignore[assignment]
                dept_lead_id = sub_id if count == 1 else f"{sub_id}-1"
            else:
                parent_agent_id = dept_lead_id

            for i in range(count):
                a_name = f"{sub_name} {i + 1}" if count > 1 else sub_name
                a_id = f"{sub_id}-{i + 1}" if count > 1 else sub_id

                agents.append(
                    {
                        "agent_id": a_id,
                        "name": a_name,
                        "role_label": sub_inferred_role,
                        "level": max(1, min(10, sub_level)),
                        "domain": domain,
                        "parent_agent_id": parent_agent_id,
                        "model": sub_meta.get("model", "sonnet"),
                        "status": "active",
                    }
                )

    return agents


# ---------------------------------------------------------------------------
# Org settings parser
# ---------------------------------------------------------------------------


def parse_org_settings(text: str) -> dict[str, object]:
    """Extract org-level settings (default_autonomy, risk_overrides) from ORG.md."""
    settings: dict[str, object] = {}

    # Default Autonomy from Culture section
    # Handles: "- **Default Autonomy:** 7" or "- Default Autonomy: 7"
    m = re.search(r"[-*]\s+\*{0,2}Default[_ ]Autonomy\*{0,2}:\*{0,2}\s*(\d+)", text, re.IGNORECASE)
    if m:
        settings["default_autonomy"] = int(m.group(1))

    # Risk Overrides subsection under Policies
    overrides: dict[str, int] = {}
    in_risk_section = False
    for line in text.split("\n"):
        if re.match(r"^#{2,4}\s+Risk\s+Override", line, re.IGNORECASE):
            in_risk_section = True
            continue
        if in_risk_section and re.match(r"^#{1,4}\s+", line):
            break
        if in_risk_section:
            om = re.match(r"^[-*]\s+([\w/]+):\s*(\d+)", line)
            if om:
                overrides[om.group(1).strip()] = int(om.group(2))

    if overrides:
        settings["risk_overrides"] = overrides

    return settings


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def _has_agents_table(text: str) -> bool:
    """Detect if the markdown contains an agents table under ## Agents."""
    in_agents = False
    for line in text.split("\n"):
        if re.match(r"^#{1,3}\s+agents\s*$", line.strip(), re.IGNORECASE):
            in_agents = True
            continue
        if in_agents and line.strip().startswith("|"):
            return True
        if in_agents and re.match(r"^#{1,3}\s+", line.strip()):
            break
    return False


def parse_org_md(path: str) -> list[dict[str, object]]:
    """Parse an ORG.md file, returning a list of agent dicts.

    Supports two formats:
    1. Table-based: ``## Agents`` section with a markdown table
    2. Section-based: ``## Structure`` section with nested headings (TS-compatible)
    """
    text = Path(path).read_text(encoding="utf-8")
    return parse_org_md_content(text)


def parse_org_md_content(text: str) -> list[dict[str, object]]:
    """Parse ORG.md content string into agent dicts."""
    if _has_agents_table(text):
        # Extract lines under ## Agents
        agent_lines: list[str] = []
        in_agents = False
        for line in text.split("\n"):
            if re.match(r"^#{1,3}\s+agents\s*$", line.strip(), re.IGNORECASE):
                in_agents = True
                continue
            if in_agents and re.match(r"^#{1,3}\s+", line.strip()):
                break
            if in_agents:
                agent_lines.append(line)

        rows = _parse_table(agent_lines)
        return _agents_from_table(rows)

    return _parse_sections(text)


def extract_org_name(path: str) -> str:
    """Extract the org name from the H1 heading."""
    text = Path(path).read_text(encoding="utf-8")
    for line in text.split("\n"):
        m = re.match(r"^#\s+(.+)$", line)
        if m:
            return m.group(1).strip()
    return "Default Organization"


async def seed_from_org(org_path: str, session: AsyncSession | None = None) -> int:
    """Read ORG.md, upsert agents into the database.

    If *session* is provided it is used directly; otherwise a new session is
    created from the default ``async_session`` factory.

    Returns the number of agents upserted.
    """
    from app.database import async_session

    text = Path(org_path).read_text(encoding="utf-8")  # noqa: ASYNC240
    agents = parse_org_md_content(text)
    if not agents:
        logger.warning("No agents found in %s", org_path)
        return 0

    org_name = extract_org_name(org_path)
    org_slug = _make_id(org_name)
    org_settings = parse_org_settings(text)

    own_session = session is None
    if own_session:
        session = async_session()

    try:
        # Upsert organization
        result = await session.execute(select(Organization).where(Organization.slug == org_slug))
        org = result.scalar_one_or_none()
        if org is None:
            org = Organization(name=org_name, slug=org_slug)
            session.add(org)
            await session.flush()
            logger.info("Created organization %s (%s)", org_name, org.id)

        # Merge org-level settings from ORG.md into existing settings
        if org_settings:
            merged = {**(org.settings or {}), **org_settings}
            org.settings = merged

        org_id: uuid.UUID = org.id  # type: ignore[assignment]

        # Build agent_id -> UUID map for parent resolution
        id_map: dict[str, uuid.UUID] = {}

        # First pass: fetch existing agents
        existing_result = await session.execute(select(Agent).where(Agent.org_id == org_id))
        for existing_agent in existing_result.scalars():
            id_map[existing_agent.agent_id] = existing_agent.id  # type: ignore[assignment]

        # Upsert agents
        count = 0
        for agent_dict in agents:
            agent_id_str: str = agent_dict["agent_id"]  # type: ignore[assignment]
            role_label: str = agent_dict["role_label"]  # type: ignore[assignment]

            result = await session.execute(
                select(Agent).where(Agent.org_id == org_id, Agent.agent_id == agent_id_str)
            )
            existing = result.scalar_one_or_none()

            level: int = agent_dict["level"]  # type: ignore[assignment]
            role_enum = _map_role_to_enum(role_label)
            mode_enum = _map_role_to_mode(role_label, level)

            if existing:
                # Update mutable fields
                existing.name = agent_dict["name"]  # type: ignore[assignment]
                existing.level = level
                existing.role = role_enum.value
                existing.mode = mode_enum.value
                existing.domain = agent_dict.get("domain")  # type: ignore[assignment]
                existing.model = agent_dict.get("model", "sonnet")  # type: ignore[assignment]
                existing.status = AgentStatus.ACTIVE.value
                id_map[agent_id_str] = existing.id  # type: ignore[assignment]
            else:
                agent = Agent(
                    org_id=org_id,
                    agent_id=agent_id_str,
                    name=agent_dict["name"],
                    level=level,
                    model=agent_dict.get("model", "sonnet"),
                    status=AgentStatus.ACTIVE.value,
                    role=role_enum.value,
                    mode=mode_enum.value,
                    hmac_secret_enc=_generate_hmac_bytes(),
                    domain=agent_dict.get("domain"),
                    metadata_={},
                )
                session.add(agent)
                await session.flush()
                id_map[agent_id_str] = agent.id  # type: ignore[assignment]

            count += 1

        # Second pass: resolve parent relationships
        for agent_dict in agents:
            parent_agent_id: str | None = agent_dict.get("parent_agent_id")  # type: ignore[assignment]
            if not parent_agent_id:
                continue

            parent_uuid = id_map.get(parent_agent_id)
            if not parent_uuid:
                logger.warning(
                    "Parent '%s' not found for agent '%s'",
                    parent_agent_id,
                    agent_dict["agent_id"],
                )
                continue

            result = await session.execute(
                select(Agent).where(
                    Agent.org_id == org_id,
                    Agent.agent_id == agent_dict["agent_id"],
                )
            )
            agent = result.scalar_one_or_none()
            if agent:
                agent.parent_id = parent_uuid

        if own_session:
            await session.commit()
        else:
            await session.flush()

        logger.info("Seeded %d agents from %s", count, org_path)
        return count

    except Exception:
        if own_session:
            await session.rollback()
        raise
    finally:
        if own_session:
            await session.close()
