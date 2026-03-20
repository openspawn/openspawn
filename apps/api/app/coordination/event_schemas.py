"""Pydantic payload schemas for coordination event types (#709).

Each known SSE coordination event type has a corresponding payload model.
Unknown event types pass through without validation (extensibility).
"""

from __future__ import annotations

from pydantic import BaseModel


# ── Component events ──────────────────────────────────────────────


class ComponentCreatedPayload(BaseModel):
    name: str
    file_path: str
    test_ids: list[str] = []
    props: list[dict[str, str]] = []
    route: str | None = None


class ComponentUpdatedPayload(ComponentCreatedPayload):
    pass


# ── Test events ───────────────────────────────────────────────────


class TestWrittenPayload(BaseModel):
    covers_component: str
    test_file: str
    test_ids_used: list[str] = []
    scenarios: list[str] = []


class TestPassedPayload(BaseModel):
    test_file: str
    passed_count: int
    failed_count: int = 0


class TestFailedPayload(TestPassedPayload):
    errors: list[str] = []


# ── Doc events ────────────────────────────────────────────────────


class DocSectionWrittenPayload(BaseModel):
    name: str
    section: str
    content_md: str
    screenshot_url: str | None = None


# ── API contract events ──────────────────────────────────────────


class ApiContractDefinedPayload(BaseModel):
    endpoint: str
    method: str
    request_schema: dict | None = None
    response_schema: dict | None = None


class ApiContractChangedPayload(ApiContractDefinedPayload):
    pass


# ── Build events ─────────────────────────────────────────────────


class BuildSucceededPayload(BaseModel):
    duration_ms: int | None = None
    output: str | None = None


class BuildFailedPayload(BuildSucceededPayload):
    error: str


# ── Screenshot / Migration / Dependency (lightweight) ────────────


class ScreenshotCapturedPayload(BaseModel):
    name: str
    url: str
    file_path: str | None = None


class MigrationCreatedPayload(BaseModel):
    name: str
    file_path: str


class DependencyAddedPayload(BaseModel):
    name: str
    version: str | None = None
    dev: bool = False


# ── Registry ─────────────────────────────────────────────────────

EVENT_PAYLOAD_SCHEMAS: dict[str, type[BaseModel]] = {
    "component.created": ComponentCreatedPayload,
    "component.updated": ComponentUpdatedPayload,
    "test.written": TestWrittenPayload,
    "test.passed": TestPassedPayload,
    "test.failed": TestFailedPayload,
    "doc.section.written": DocSectionWrittenPayload,
    "api_contract.defined": ApiContractDefinedPayload,
    "api_contract.changed": ApiContractChangedPayload,
    "build.succeeded": BuildSucceededPayload,
    "build.failed": BuildFailedPayload,
    "screenshot.captured": ScreenshotCapturedPayload,
    "migration.created": MigrationCreatedPayload,
    "dependency.added": DependencyAddedPayload,
}
