from __future__ import annotations

import os
import uuid

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.auth.schemas import AuthenticatedAgent
from app.database import get_db
from app.models.agent import Agent, AgentCapability
from app.models.credit import CreditTransaction
from app.models.enums import AgentRole, AgentStatus, CreditType, Proficiency
from app.models.reputation import ReputationEvent
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/agents", tags=["agents"])


def _encrypt_secret(plaintext: str) -> bytes:
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not configured")
    key_bytes = bytes.fromhex(key)
    aesgcm = AESGCM(key_bytes)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ct


def _generate_hmac_secret() -> str:
    return os.urandom(32).hex()


# --- Registration ---


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_agent(
    dto: dict,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentRegistrationResponse]:
    from app.agents.schemas import CreateAgentDto

    body = CreateAgentDto.model_validate(dto)

    # Only HR or ADMIN can register
    if isinstance(auth, AuthenticatedAgent) and auth.role not in (
        AgentRole.HR,
        AgentRole.ADMIN,
        AgentRole.FOUNDER,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR role required")

    # Check duplicate agent_id
    existing = await db.execute(
        select(Agent).where(Agent.org_id == auth.org_id, Agent.agent_id == body.agent_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent ID already exists")

    hmac_secret = _generate_hmac_secret()
    hmac_enc = _encrypt_secret(hmac_secret)

    agent = Agent(
        org_id=auth.org_id,
        agent_id=body.agent_id,
        name=body.name,
        level=body.level,
        model=body.model,
        status=AgentStatus.ACTIVE,
        role=body.role.value,
        mode=body.mode.value,
        management_fee_pct=body.management_fee_pct,
        budget_period_limit=body.budget_period_limit,
        hmac_secret_enc=hmac_enc,
        metadata_=body.metadata,
    )
    db.add(agent)
    await db.flush()

    # Add capabilities
    if body.capabilities:
        for cap in body.capabilities:
            db.add(
                AgentCapability(
                    org_id=auth.org_id,
                    agent_id=agent.id,
                    capability=cap.capability,
                    proficiency=cap.proficiency.value,
                )
            )

    await db.commit()
    await db.refresh(agent)

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
    q = select(Agent).where(Agent.org_id == auth.org_id, Agent.deleted_at.is_(None))
    if status_filter:
        q = q.where(Agent.status == status_filter.value)
    if role:
        q = q.where(Agent.role == role.value)
    result = await db.execute(q.order_by(Agent.created_at))
    agents = result.scalars().all()
    return DataResponse(data=[AgentResponse.model_validate(a) for a in agents])


@router.get("/{agent_id}")
async def get_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[AgentResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    return DataResponse(data=AgentResponse.model_validate(agent))


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: uuid.UUID,
    dto: UpdateAgentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[AgentResponse]:
    if isinstance(auth, AuthenticatedAgent) and auth.role not in (
        AgentRole.HR,
        AgentRole.ADMIN,
        AgentRole.FOUNDER,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR role required")

    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    update_data = dto.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "mode" and value is not None:
            setattr(agent, field, value.value)
        else:
            setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return DataResponse(data=AgentResponse.model_validate(agent))


@router.post("/{agent_id}/revoke")
async def revoke_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    if isinstance(auth, AuthenticatedAgent) and auth.role not in (
        AgentRole.HR,
        AgentRole.ADMIN,
        AgentRole.FOUNDER,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR role required")

    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    agent.status = AgentStatus.REVOKED.value
    await db.commit()
    await db.refresh(agent)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent revoked")


# --- Onboarding ---


@router.post("/spawn", status_code=status.HTTP_201_CREATED)
async def spawn_agent(
    dto: SpawnAgentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentRegistrationResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    # Child level must be < parent level
    if dto.level >= auth.level:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Child level must be lower than parent level",
        )

    # Check max children
    parent = await _get_agent_or_404(db, auth.id, auth.org_id)
    children_count = await db.scalar(select(func.count()).where(Agent.parent_id == parent.id))
    if children_count is not None and children_count >= parent.max_children > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum children limit reached"
        )

    hmac_secret = _generate_hmac_secret()
    hmac_enc = _encrypt_secret(hmac_secret)

    child = Agent(
        org_id=auth.org_id,
        agent_id=dto.agent_id,
        name=dto.name,
        level=dto.level,
        model=dto.model,
        status=AgentStatus.PENDING.value,
        role=AgentRole.WORKER.value,
        mode="worker",
        parent_id=parent.id,
        budget_period_limit=dto.budget_period_limit,
        hmac_secret_enc=hmac_enc,
        metadata_={},
    )
    db.add(child)
    await db.flush()

    if dto.capabilities:
        for cap in dto.capabilities:
            db.add(
                AgentCapability(
                    org_id=auth.org_id,
                    agent_id=child.id,
                    capability=cap.capability,
                    proficiency=cap.proficiency.value,
                )
            )

    await db.commit()
    await db.refresh(child)

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
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )
    parent = await _get_agent_or_404(db, auth.id, auth.org_id)
    children_count = await db.scalar(select(func.count()).where(Agent.parent_id == parent.id)) or 0
    return DataResponse(
        data={
            "max_children": parent.max_children,
            "current_children": children_count,
            "can_spawn": parent.max_children == 0 or children_count < parent.max_children,
        }
    )


@router.get("/pending")
async def get_pending_agents(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentResponse]]:
    result = await db.execute(
        select(Agent).where(
            Agent.org_id == auth.org_id,
            Agent.status == AgentStatus.PENDING.value,
        )
    )
    return DataResponse(data=[AgentResponse.model_validate(a) for a in result.scalars().all()])


@router.post("/{agent_id}/activate")
async def activate_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    if agent.status != AgentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Agent is not in PENDING status"
        )

    # Must be parent or L10+
    if isinstance(auth, AuthenticatedAgent):
        is_parent = agent.parent_id == auth.id
        is_high_level = auth.level >= 10
        if not (is_parent or is_high_level):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parent agent or L10+ can activate",
            )

    agent.status = AgentStatus.ACTIVE.value
    await db.commit()
    await db.refresh(agent)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent activated")


@router.delete("/{agent_id}/reject")
async def reject_agent(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[AgentResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    if agent.status != AgentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Agent is not in PENDING status"
        )

    agent.status = AgentStatus.REVOKED.value
    await db.commit()
    await db.refresh(agent)
    return DataMessageResponse(data=AgentResponse.model_validate(agent), message="Agent rejected")


@router.get("/{agent_id}/hierarchy")
async def get_hierarchy(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    depth: int = Query(default=3, ge=1, le=10),
) -> DataResponse[HierarchyNode]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    tree = await _build_hierarchy(db, agent, depth)
    return DataResponse(data=tree)


# --- Budget & Credits ---


@router.get("/{agent_id}/credits/balance")
async def get_balance(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BalanceResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    return DataResponse(data=BalanceResponse(balance=agent.current_balance))


@router.get("/{agent_id}/budget")
async def get_budget(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BudgetResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    remaining = None
    can_spend = True
    limit_val = agent.budget_period_limit
    if limit_val is not None:
        remaining = limit_val - agent.budget_period_spent
        can_spend = remaining > 0
    return DataResponse(
        data=BudgetResponse(
            budget_period_limit=agent.budget_period_limit,
            budget_period_spent=agent.budget_period_spent,
            budget_period_start=agent.budget_period_start,
            can_spend=can_spend,
            remaining=remaining,
        )
    )


@router.patch("/{agent_id}/budget")
async def set_budget(
    agent_id: uuid.UUID,
    dto: SetBudgetDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[BudgetResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    agent.budget_period_limit = dto.budget_period_limit
    if dto.reset_current_period:
        agent.budget_period_spent = 0
        import pendulum

        agent.budget_period_start = pendulum.now("UTC")
    await db.commit()
    await db.refresh(agent)
    remaining = None
    can_spend = True
    limit_val = agent.budget_period_limit
    if limit_val is not None:
        remaining = limit_val - agent.budget_period_spent
        can_spend = remaining > 0
    return DataResponse(
        data=BudgetResponse(
            budget_period_limit=agent.budget_period_limit,
            budget_period_spent=agent.budget_period_spent,
            budget_period_start=agent.budget_period_start,
            can_spend=can_spend,
            remaining=remaining,
        )
    )


@router.post("/credits/transfer")
async def transfer_credits(
    dto: TransferCreditsDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    from_agent = await _get_agent_or_404(db, auth.id, auth.org_id)
    to_agent = await _get_agent_or_404(db, dto.to_agent_id, auth.org_id)

    if from_agent.current_balance < dto.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    # Apply management fee
    fee = 0
    if to_agent.parent_id and to_agent.parent_id != from_agent.id:
        fee = int(dto.amount * from_agent.management_fee_pct / 100)

    net_amount = dto.amount - fee

    # Debit sender
    from_agent.current_balance -= dto.amount
    db.add(
        CreditTransaction(
            org_id=auth.org_id,
            agent_id=from_agent.id,
            type=CreditType.DEBIT.value,
            amount=dto.amount,
            balance_after=from_agent.current_balance,
            reason=f"Transfer to {to_agent.agent_id}: {dto.reason}",
        )
    )

    # Credit receiver
    to_agent.current_balance += net_amount
    db.add(
        CreditTransaction(
            org_id=auth.org_id,
            agent_id=to_agent.id,
            type=CreditType.CREDIT.value,
            amount=net_amount,
            balance_after=to_agent.current_balance,
            reason=f"Transfer from {from_agent.agent_id}: {dto.reason}",
            source_agent_id=from_agent.id,
        )
    )

    await db.commit()
    return DataMessageResponse(
        data={"transferred": dto.amount, "fee": fee, "net": net_amount},
        message=f"Transferred {net_amount} credits",
    )


@router.get("/{agent_id}/budget/can-spend")
async def can_spend(
    agent_id: uuid.UUID,
    amount: int = Query(gt=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    has_balance = agent.current_balance >= amount
    within_budget = True
    if agent.budget_period_limit is not None:
        within_budget = (agent.budget_period_spent + amount) <= agent.budget_period_limit
    return DataResponse(
        data={"can_spend": has_balance and within_budget, "balance": agent.current_balance}
    )


@router.get("/budget/alerts")
async def budget_alerts(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[dict]]:
    result = await db.execute(
        select(Agent).where(
            Agent.org_id == auth.org_id,
            Agent.budget_period_limit.isnot(None),
            Agent.status == AgentStatus.ACTIVE.value,
        )
    )
    alerts = []
    for agent in result.scalars().all():
        if agent.budget_period_limit and agent.budget_period_limit > 0:
            pct = agent.budget_period_spent / agent.budget_period_limit * 100
            if pct >= 80:
                alerts.append(
                    {
                        "agent_id": agent.agent_id,
                        "name": agent.name,
                        "budget_period_limit": agent.budget_period_limit,
                        "budget_period_spent": agent.budget_period_spent,
                        "percentage_used": round(pct, 1),
                    }
                )
    return DataResponse(data=alerts)


# --- Capabilities ---


@router.get("/capabilities")
async def list_org_capabilities(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[str]]:
    result = await db.execute(
        select(AgentCapability.capability).where(AgentCapability.org_id == auth.org_id).distinct()
    )
    return DataResponse(data=list(result.scalars().all()))


@router.get("/capabilities/match")
async def match_capabilities(
    capabilities: str = Query(description="Comma-separated capabilities"),
    min_proficiency: Proficiency = Query(default=Proficiency.BASIC),
    only_active: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentResponse]]:
    caps = [c.strip() for c in capabilities.split(",")]
    proficiency_order = [Proficiency.BASIC, Proficiency.STANDARD, Proficiency.EXPERT]
    min_idx = proficiency_order.index(min_proficiency)
    valid_profs = [p.value for p in proficiency_order[min_idx:]]

    q = (
        select(Agent)
        .join(AgentCapability, Agent.id == AgentCapability.agent_id)
        .where(
            Agent.org_id == auth.org_id,
            AgentCapability.capability.in_(caps),
            AgentCapability.proficiency.in_(valid_profs),
        )
    )
    if only_active:
        q = q.where(Agent.status == AgentStatus.ACTIVE.value)
    q = q.distinct()
    result = await db.execute(q)
    return DataResponse(data=[AgentResponse.model_validate(a) for a in result.scalars().all()])


@router.get("/{agent_id}/capabilities")
async def get_agent_capabilities(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[CapabilityResponse]]:
    await _get_agent_or_404(db, agent_id, auth.org_id)
    result = await db.execute(select(AgentCapability).where(AgentCapability.agent_id == agent_id))
    return DataResponse(data=[CapabilityResponse.model_validate(c) for c in result.scalars().all()])


@router.post("/{agent_id}/capabilities", status_code=status.HTTP_201_CREATED)
async def add_capability(
    agent_id: uuid.UUID,
    dto: AddCapabilityDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[CapabilityResponse]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)

    # Check duplicate
    existing = await db.execute(
        select(AgentCapability).where(
            AgentCapability.agent_id == agent.id,
            AgentCapability.capability == dto.capability,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Capability already exists"
        )

    cap = AgentCapability(
        org_id=auth.org_id,
        agent_id=agent.id,
        capability=dto.capability,
        proficiency=dto.proficiency.value,
    )
    db.add(cap)
    await db.commit()
    await db.refresh(cap)
    return DataResponse(data=CapabilityResponse.model_validate(cap))


@router.patch("/capabilities/{capability_id}")
async def update_capability(
    capability_id: uuid.UUID,
    dto: UpdateCapabilityDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[CapabilityResponse]:
    result = await db.execute(
        select(AgentCapability).where(
            AgentCapability.id == capability_id, AgentCapability.org_id == auth.org_id
        )
    )
    cap = result.scalar_one_or_none()
    if not cap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    cap.proficiency = dto.proficiency.value
    await db.commit()
    await db.refresh(cap)
    return DataResponse(data=CapabilityResponse.model_validate(cap))


@router.delete("/capabilities/{capability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_capability(
    capability_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    result = await db.execute(
        select(AgentCapability).where(
            AgentCapability.id == capability_id, AgentCapability.org_id == auth.org_id
        )
    )
    cap = result.scalar_one_or_none()
    if not cap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    await db.delete(cap)
    await db.commit()


# --- Trust & Reputation ---


@router.get("/{agent_id}/reputation")
async def get_reputation(
    agent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ReputationSummary]:
    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    success_rate = (
        agent.tasks_successful / agent.tasks_completed if agent.tasks_completed > 0 else 0.0
    )
    level = "NEW"
    if agent.trust_score >= 90:
        level = "ELITE"
    elif agent.trust_score >= 75:
        level = "VETERAN"
    elif agent.trust_score >= 50:
        level = "TRUSTED"
    elif agent.trust_score >= 25:
        level = "PROBATION"

    return DataResponse(
        data=ReputationSummary(
            trust_score=agent.trust_score,
            tasks_completed=agent.tasks_completed,
            tasks_successful=agent.tasks_successful,
            success_rate=round(success_rate, 4),
            level=level,
        )
    )


@router.get("/{agent_id}/reputation/history")
async def get_reputation_history(
    agent_id: uuid.UUID,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ReputationEventResponse]:
    await _get_agent_or_404(db, agent_id, auth.org_id)

    total = (
        await db.scalar(
            select(func.count()).where(
                ReputationEvent.agent_id == agent_id, ReputationEvent.org_id == auth.org_id
            )
        )
        or 0
    )

    result = await db.execute(
        select(ReputationEvent)
        .where(ReputationEvent.agent_id == agent_id, ReputationEvent.org_id == auth.org_id)
        .order_by(ReputationEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    events = [ReputationEventResponse.model_validate(e) for e in result.scalars().all()]
    return PaginatedResponse(
        data=events, meta=PaginationMeta(total=total, page=(offset // limit) + 1, limit=limit)
    )


@router.post("/{agent_id}/reputation/bonus")
async def award_bonus(
    agent_id: uuid.UUID,
    dto: ReputationBonusPenaltyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ReputationSummary]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )
    if auth.level < 7:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="L7+ required for reputation changes"
        )

    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    prev_score = agent.trust_score
    agent.trust_score = min(100, agent.trust_score + dto.impact)

    db.add(
        ReputationEvent(
            org_id=auth.org_id,
            agent_id=agent.id,
            type="QUALITY_BONUS",
            impact=dto.impact,
            previous_score=prev_score,
            new_score=agent.trust_score,
            triggered_by=auth.id,
            reason=dto.reason,
        )
    )

    await db.commit()
    await db.refresh(agent)

    success_rate = (
        agent.tasks_successful / agent.tasks_completed if agent.tasks_completed > 0 else 0.0
    )
    return DataMessageResponse(
        data=ReputationSummary(
            trust_score=agent.trust_score,
            tasks_completed=agent.tasks_completed,
            tasks_successful=agent.tasks_successful,
            success_rate=round(success_rate, 4),
            level="TRUSTED",
        ),
        message="Bonus awarded",
    )


@router.post("/{agent_id}/reputation/penalty")
async def apply_penalty(
    agent_id: uuid.UUID,
    dto: ReputationBonusPenaltyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ReputationSummary]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )
    if auth.level < 7:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="L7+ required for reputation changes"
        )

    agent = await _get_agent_or_404(db, agent_id, auth.org_id)
    prev_score = agent.trust_score
    agent.trust_score = max(0, agent.trust_score - dto.impact)

    db.add(
        ReputationEvent(
            org_id=auth.org_id,
            agent_id=agent.id,
            type="QUALITY_PENALTY",
            impact=-dto.impact,
            previous_score=prev_score,
            new_score=agent.trust_score,
            triggered_by=auth.id,
            reason=dto.reason,
        )
    )

    await db.commit()
    await db.refresh(agent)

    success_rate = (
        agent.tasks_successful / agent.tasks_completed if agent.tasks_completed > 0 else 0.0
    )
    return DataMessageResponse(
        data=ReputationSummary(
            trust_score=agent.trust_score,
            tasks_completed=agent.tasks_completed,
            tasks_successful=agent.tasks_successful,
            success_rate=round(success_rate, 4),
            level="TRUSTED",
        ),
        message="Penalty applied",
    )


@router.get("/leaderboard/trust")
async def trust_leaderboard(
    limit: int = Query(default=10, le=100),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[LeaderboardEntry]]:
    result = await db.execute(
        select(Agent)
        .where(Agent.org_id == auth.org_id, Agent.status == AgentStatus.ACTIVE.value)
        .order_by(Agent.trust_score.desc())
        .limit(limit)
    )
    entries = []
    for a in result.scalars().all():
        rate = a.tasks_successful / a.tasks_completed if a.tasks_completed > 0 else 0.0
        entries.append(
            LeaderboardEntry(
                agent_id=a.agent_id,
                name=a.name,
                trust_score=a.trust_score,
                tasks_completed=a.tasks_completed,
                success_rate=round(rate, 4),
            )
        )
    return DataResponse(data=entries)


# --- Helpers ---


async def _get_agent_or_404(db: AsyncSession, agent_id: uuid.UUID, org_id: uuid.UUID) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.org_id == org_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


async def _build_hierarchy(db: AsyncSession, agent: Agent, depth: int) -> HierarchyNode:
    children_list: list[HierarchyNode] = []
    if depth > 0:
        result = await db.execute(
            select(Agent).where(Agent.parent_id == agent.id, Agent.deleted_at.is_(None))
        )
        for child in result.scalars().all():
            children_list.append(await _build_hierarchy(db, child, depth - 1))

    return HierarchyNode(
        id=agent.id,
        agent_id=agent.agent_id,
        name=agent.name,
        level=agent.level,
        status=AgentStatus(agent.status),
        role=AgentRole(agent.role),
        children=children_list,
    )
