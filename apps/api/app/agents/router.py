from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import app.agents.service as service
from app.agents.schemas import (
    AddCapabilityDto,
    AgentRegistrationResponse,
    AgentResponse,
    BalanceResponse,
    BudgetResponse,
    CapabilityResponse,
    HierarchyNode,
    LeaderboardEntry,
    ReputationBonusPenaltyDto,
    ReputationEventResponse,
    ReputationSummary,
    SetBudgetDto,
    SpawnAgentDto,
    TransferCreditsDto,
    UpdateAgentDto,
    UpdateCapabilityDto,
)
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.models.enums import AgentRole, AgentStatus, Proficiency
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse

router = APIRouter(prefix="/agents", tags=["agents"])


# --- Registration ---


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_agent(
    dto: dict,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentRegistrationResponse]:
    from app.agents.schemas import CreateAgentDto
    from app.observability.spans import agent_register_span

    body = CreateAgentDto.model_validate(dto)
    with agent_register_span(org_id=auth.org_id):
        agent, hmac_secret = await service.register_agent(db, auth, body)
    return DataMessageResponse(
        data=AgentRegistrationResponse(
            agent=AgentResponse.model_validate(agent),
            hmac_secret=hmac_secret,
        ),
        message="Agent registered. Save the HMAC secret — it will not be shown again.",
    )


# --- CRUD ---


@router.get("")
async def list_agents(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    status_filter: AgentStatus | None = Query(None, alias="status"),
    role: AgentRole | None = None,
) -> DataResponse[list[AgentResponse]]:
    agents = await service.list_agents(db, auth, status_filter, role)
    return DataResponse(data=[AgentResponse.model_validate(a) for a in agents])


@router.get("/{agent_id}")
async def get_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[AgentResponse]:
    agent = await service.get_agent(db, agent_id, auth)
    return DataResponse(data=AgentResponse.model_validate(agent))


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: uuid.UUID,
    dto: UpdateAgentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[AgentResponse]:
    agent = await service.update_agent(db, agent_id, auth, dto)
    return DataResponse(data=AgentResponse.model_validate(agent))


@router.post("/{agent_id}/revoke")
async def revoke_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    agent = await service.revoke_agent(db, agent_id, auth)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent revoked")


# --- Onboarding ---


@router.post("/spawn", status_code=status.HTTP_201_CREATED)
async def spawn_agent(
    dto: SpawnAgentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentRegistrationResponse]:
    child, hmac_secret = await service.spawn_agent(db, auth, dto)
    return DataMessageResponse(
        data=AgentRegistrationResponse(
            agent=AgentResponse.model_validate(child),
            hmac_secret=hmac_secret,
        ),
        message="Agent spawned in PENDING status. Requires activation.",
    )


@router.get("/capacity", name="get_capacity")
async def get_capacity(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    data = await service.get_capacity(db, auth)
    return DataResponse(data=data)


@router.get("/pending")
async def get_pending_agents(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentResponse]]:
    agents = await service.get_pending_agents(db, auth)
    return DataResponse(data=[AgentResponse.model_validate(a) for a in agents])


@router.post("/{agent_id}/activate")
async def activate_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    agent = await service.activate_agent(db, agent_id, auth)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent activated")


@router.delete("/{agent_id}/reject")
async def reject_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    agent = await service.reject_agent(db, agent_id, auth)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent rejected")


@router.get("/{agent_id}/hierarchy")
async def get_hierarchy(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    depth: int = Query(default=3, ge=1, le=10),
) -> DataResponse[HierarchyNode]:
    tree = await service.get_hierarchy(db, agent_id, auth, depth)
    return DataResponse(data=tree)


# --- Budget & Credits ---


@router.get("/{agent_id}/credits/balance")
async def get_balance(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BalanceResponse]:
    balance = await service.get_balance(db, agent_id, auth)
    return DataResponse(data=BalanceResponse(balance=balance))


@router.get("/{agent_id}/budget")
async def get_budget(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BudgetResponse]:
    budget = await service.get_budget(db, agent_id, auth)
    return DataResponse(data=budget)


@router.patch("/{agent_id}/budget")
async def set_budget(
    agent_id: uuid.UUID,
    dto: SetBudgetDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BudgetResponse]:
    budget = await service.set_budget(db, agent_id, auth, dto)
    return DataResponse(data=budget)


@router.post("/credits/transfer")
async def transfer_credits(
    dto: TransferCreditsDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    data = await service.transfer_credits(db, auth, dto)
    return DataMessageResponse(
        data=data,
        message=f"Transferred {data['net']} credits",
    )


@router.get("/{agent_id}/budget/can-spend")
async def can_spend(
    agent_id: uuid.UUID,
    amount: int = Query(gt=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    data = await service.can_spend(db, agent_id, auth, amount)
    return DataResponse(data=data)


@router.get("/budget/alerts")
async def budget_alerts(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[dict]]:
    alerts = await service.budget_alerts(db, auth)
    return DataResponse(data=alerts)


# --- Capabilities ---


@router.get("/capabilities")
async def list_org_capabilities(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[str]]:
    caps = await service.list_org_capabilities(db, auth)
    return DataResponse(data=caps)


@router.get("/capabilities/match")
async def match_capabilities(
    capabilities: str = Query(description="Comma-separated capabilities"),
    min_proficiency: Proficiency = Query(default=Proficiency.BASIC),
    only_active: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentResponse]]:
    agents = await service.match_capabilities(db, auth, capabilities, min_proficiency, only_active)
    return DataResponse(data=[AgentResponse.model_validate(a) for a in agents])


@router.get("/{agent_id}/capabilities")
async def get_agent_capabilities(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[CapabilityResponse]]:
    caps = await service.get_agent_capabilities(db, agent_id, auth)
    return DataResponse(data=[CapabilityResponse.model_validate(c) for c in caps])


@router.post("/{agent_id}/capabilities", status_code=status.HTTP_201_CREATED)
async def add_capability(
    agent_id: uuid.UUID,
    dto: AddCapabilityDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[CapabilityResponse]:
    cap = await service.add_capability(db, agent_id, auth, dto)
    return DataResponse(data=CapabilityResponse.model_validate(cap))


@router.patch("/capabilities/{capability_id}")
async def update_capability(
    capability_id: uuid.UUID,
    dto: UpdateCapabilityDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[CapabilityResponse]:
    cap = await service.update_capability(db, capability_id, auth, dto)
    return DataResponse(data=CapabilityResponse.model_validate(cap))


@router.delete("/capabilities/{capability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_capability(
    capability_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    await service.delete_capability(db, capability_id, auth)


# --- Trust & Reputation ---


@router.get("/{agent_id}/reputation")
async def get_reputation(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ReputationSummary]:
    summary = await service.get_reputation(db, agent_id, auth)
    return DataResponse(data=summary)


@router.get("/{agent_id}/reputation/history")
async def get_reputation_history(
    agent_id: uuid.UUID,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ReputationEventResponse]:
    events, meta = await service.get_reputation_history(db, agent_id, auth, limit, offset)
    return PaginatedResponse(data=events, meta=meta)


@router.post("/{agent_id}/reputation/bonus")
async def award_bonus(
    agent_id: uuid.UUID,
    dto: ReputationBonusPenaltyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ReputationSummary]:
    summary = await service.award_bonus(db, agent_id, auth, dto)
    return DataMessageResponse(data=summary, message="Bonus awarded")


@router.post("/{agent_id}/reputation/penalty")
async def apply_penalty(
    agent_id: uuid.UUID,
    dto: ReputationBonusPenaltyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ReputationSummary]:
    summary = await service.apply_penalty(db, agent_id, auth, dto)
    return DataMessageResponse(data=summary, message="Penalty applied")


@router.get("/leaderboard/trust")
async def trust_leaderboard(
    limit: int = Query(default=10, le=100),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[LeaderboardEntry]]:
    entries = await service.trust_leaderboard(db, auth, limit)
    return DataResponse(data=entries)
