"""Guardrails API router — evaluate guardrails against events."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.dependencies import AuthContext, require_auth
from app.guardrails.engine import evaluate_guardrails
from app.guardrails.schema import (
    EvaluateRequest,
    EvaluateResponse,
    GuardrailDefinition,
)
from app.schemas import DataResponse

router = APIRouter(prefix="/guardrails", tags=["guardrails"])

# In-memory guardrail store (per-org, loaded from ORG.md or API)
_org_guardrails: dict[str, list[GuardrailDefinition]] = {}


@router.get("")
async def list_guardrails(
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[GuardrailDefinition]]:
    """List all guardrails for the authenticated org."""
    org_key = str(auth.org_id)
    return DataResponse(data=_org_guardrails.get(org_key, []))


@router.post("")
async def set_guardrails(
    guardrails: list[GuardrailDefinition],
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[GuardrailDefinition]]:
    """Set/replace all guardrails for the authenticated org."""
    org_key = str(auth.org_id)
    _org_guardrails[org_key] = guardrails
    return DataResponse(data=guardrails)


@router.post("/evaluate")
async def evaluate(
    request: EvaluateRequest,
    auth: AuthContext = Depends(require_auth),
) -> EvaluateResponse:
    """Evaluate an event against guardrails.

    If guardrails are provided in the request, uses those.
    Otherwise falls back to org-level guardrails.
    """
    org_key = str(auth.org_id)
    guardrails = request.guardrails or _org_guardrails.get(org_key, [])
    return evaluate_guardrails(guardrails, request.event)
