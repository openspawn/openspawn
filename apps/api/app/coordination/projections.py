from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.event import Event


def project_component_registry(events: list[Event]) -> dict:
    components: dict[str, dict] = {}

    for event in events:
        if event.type not in ("component.created", "component.updated"):
            continue
        payload = (event.data or {}).get("payload", {})
        name = payload.get("name")
        if not name:
            continue

        if name not in components:
            components[name] = {
                "name": name,
                "file_path": payload.get("file_path"),
                "test_ids": payload.get("test_ids", []),
                "props": payload.get("props", []),
                "route": payload.get("route"),
                "version": 1,
                "last_updated_by": str(event.actor_id),
                "created_at": str(event.created_at),
            }
        else:
            entry = components[name]
            entry["version"] += 1
            entry["last_updated_by"] = str(event.actor_id)
            entry["updated_at"] = str(event.created_at)
            for key in ("file_path", "test_ids", "props", "route"):
                if key in payload:
                    entry[key] = payload[key]

    return {"components": components, "count": len(components)}


def project_test_coverage(events: list[Event]) -> dict:
    components: dict[str, dict] = {}
    tests: dict[str, dict] = {}

    for event in events:
        payload = (event.data or {}).get("payload", {})

        if event.type in ("component.created", "component.updated"):
            name = payload.get("name")
            if name:
                components[name] = {
                    "test_ids": payload.get("test_ids", []),
                    "has_tests": False,
                }

        elif event.type == "test.written":
            covers = payload.get("covers_component")
            test_file = payload.get("test_file", "unknown")
            if covers and covers in components:
                components[covers]["has_tests"] = True
            tests[test_file] = {
                "covers_component": covers,
                "test_ids_used": payload.get("test_ids_used", []),
                "scenarios": payload.get("scenarios", []),
            }

    covered = sum(1 for c in components.values() if c["has_tests"])
    total = len(components)

    return {
        "components": components,
        "tests": tests,
        "coverage_ratio": covered / total if total > 0 else 0,
        "covered_count": covered,
        "total_components": total,
    }


def project_artifact_view(events: list[Event]) -> dict:
    """Derive artifact-like objects from coordination events.
    Proves Artifact Bus could be reimplemented as a projection over events."""
    artifacts: dict[str, dict] = {}

    for event in events:
        payload = (event.data or {}).get("payload", {})
        entity_name = (event.data or {}).get("entity_name")
        name = entity_name or payload.get("name")
        if not name:
            continue

        artifact_type = _event_type_to_artifact_type(event.type)
        if not artifact_type:
            continue

        key = f"{artifact_type}:{name}"

        if key not in artifacts:
            artifacts[key] = {
                "artifact_type": artifact_type,
                "name": name,
                "version": 1,
                "content": payload,
                "producer_agent_id": str(event.actor_id),
                "status": "published",
                "created_at": str(event.created_at),
                "updated_at": str(event.created_at),
            }
        else:
            entry = artifacts[key]
            entry["version"] += 1
            entry["content"] = payload
            entry["updated_at"] = str(event.created_at)
            entry["producer_agent_id"] = str(event.actor_id)

    return {
        "artifacts": list(artifacts.values()),
        "count": len(artifacts),
        "hypothesis": "Artifact Bus state can be derived from coordination events",
    }


_EVENT_TO_ARTIFACT = {
    "component.created": "component",
    "component.updated": "component",
    "test.written": "test_plan",
    "screenshot.captured": "screenshot",
    "api_contract.defined": "api_contract",
    "api_contract.changed": "api_contract",
    "migration.created": "migration",
    "doc.section.written": "doc_section",
}


def _event_type_to_artifact_type(event_type: str) -> str | None:
    return _EVENT_TO_ARTIFACT.get(event_type)
