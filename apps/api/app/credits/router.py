from __future__ import annotations

import uuid

import pendulum
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.auth.schemas import AuthenticatedAgent
from app.credits.schemas import (
    AdjustCreditsDto,
    AgentSpendingResponse,
    CreditStatsResponse,
    CreditTransactionResponse,
    SpendCreditsDto,
    SpendingTrendPoint,
)
from app.database import get_db
from app.models.agent import Agent
from app.models.credit import CreditTransaction
from app.models.enums import AgentRole, CreditType
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/credits", tags=["credits"])


# --- Core operations ---


@router.get("/balance")
async def get_balance(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )
    agent = await db.get(Agent, auth.id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return DataResponse(data={"balance": agent.current_balance})


@router.post("/spend")
async def spend_credits(
    dto: SpendCreditsDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[CreditTransactionResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    agent = await db.get(Agent, auth.id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    if agent.current_balance < dto.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    # Check budget
    if (
        agent.budget_period_limit is not None
        and (agent.budget_period_spent + dto.amount) > agent.budget_period_limit
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Budget limit exceeded")

    agent.current_balance -= dto.amount
    agent.budget_period_spent += dto.amount

    txn = CreditTransaction(
        org_id=auth.org_id,
        agent_id=agent.id,
        type=CreditType.DEBIT.value,
        amount=dto.amount,
        balance_after=agent.current_balance,
        reason=dto.reason,
        trigger_type=dto.trigger_type,
        source_task_id=dto.source_task_id,
        source_agent_id=dto.source_agent_id,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return DataMessageResponse(
        data=CreditTransactionResponse.model_validate(txn),
        message=f"Spent {dto.amount} credits",
    )


@router.get("/history")
async def get_history(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[CreditTransactionResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    total = (
        await db.scalar(
            select(func.count()).where(
                CreditTransaction.agent_id == auth.id, CreditTransaction.org_id == auth.org_id
            )
        )
        or 0
    )

    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.agent_id == auth.id, CreditTransaction.org_id == auth.org_id)
        .order_by(CreditTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    txns = [CreditTransactionResponse.model_validate(t) for t in result.scalars().all()]
    return PaginatedResponse(
        data=txns, meta=PaginationMeta(total=total, page=(offset // limit) + 1, limit=limit)
    )


@router.post("/adjust")
async def adjust_credits(
    dto: AdjustCreditsDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[CreditTransactionResponse]:
    # Admin/HR only
    if isinstance(auth, AuthenticatedAgent) and auth.role not in (
        AgentRole.HR,
        AgentRole.ADMIN,
        AgentRole.FOUNDER,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin/HR role required")

    agent = await db.get(Agent, dto.agent_id)
    if not agent or agent.org_id != auth.org_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    if dto.type == CreditType.CREDIT:
        agent.current_balance += dto.amount
    else:
        agent.current_balance -= dto.amount

    txn = CreditTransaction(
        org_id=auth.org_id,
        agent_id=agent.id,
        type=dto.type.value,
        amount=dto.amount,
        balance_after=agent.current_balance,
        reason=f"Admin adjustment: {dto.reason}",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return DataMessageResponse(
        data=CreditTransactionResponse.model_validate(txn), message="Credits adjusted"
    )


# --- Analytics ---


@router.get("/analytics/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[CreditStatsResponse]:
    credits_sum = (
        await db.scalar(
            select(func.coalesce(func.sum(CreditTransaction.amount), 0)).where(
                CreditTransaction.org_id == auth.org_id,
                CreditTransaction.type == CreditType.CREDIT.value,
            )
        )
        or 0
    )

    debits_sum = (
        await db.scalar(
            select(func.coalesce(func.sum(CreditTransaction.amount), 0)).where(
                CreditTransaction.org_id == auth.org_id,
                CreditTransaction.type == CreditType.DEBIT.value,
            )
        )
        or 0
    )

    count = (
        await db.scalar(select(func.count()).where(CreditTransaction.org_id == auth.org_id)) or 0
    )

    return DataResponse(
        data=CreditStatsResponse(
            total_credits=credits_sum,
            total_debits=debits_sum,
            net=credits_sum - debits_sum,
            transaction_count=count,
        )
    )


@router.get("/analytics/trends")
async def get_trends(
    days: int = Query(default=30, ge=1, le=365),
    agent_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[SpendingTrendPoint]]:
    since = pendulum.now("UTC").subtract(days=days)
    q = select(
        func.date(CreditTransaction.created_at).label("date"),
        func.sum(CreditTransaction.amount).label("amount"),
    ).where(
        CreditTransaction.org_id == auth.org_id,
        CreditTransaction.type == CreditType.DEBIT.value,
        CreditTransaction.created_at >= since,
    )
    if agent_id:
        q = q.where(CreditTransaction.agent_id == agent_id)
    q = q.group_by(func.date(CreditTransaction.created_at)).order_by("date")

    result = await db.execute(q)
    trends = [SpendingTrendPoint(date=str(row.date), amount=row.amount) for row in result.all()]
    return DataResponse(data=trends)


@router.get("/analytics/agents")
async def get_spending_by_agent(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentSpendingResponse]]:
    result = await db.execute(
        select(
            Agent.agent_id,
            Agent.name,
            func.coalesce(func.sum(CreditTransaction.amount), 0).label("total_spent"),
            func.count(CreditTransaction.id).label("txn_count"),
        )
        .join(CreditTransaction, Agent.id == CreditTransaction.agent_id)
        .where(
            Agent.org_id == auth.org_id,
            CreditTransaction.type == CreditType.DEBIT.value,
        )
        .group_by(Agent.agent_id, Agent.name)
        .order_by(func.sum(CreditTransaction.amount).desc())
    )
    data = [
        AgentSpendingResponse(
            agent_id=row.agent_id,
            name=row.name,
            total_spent=row.total_spent,
            transaction_count=row.txn_count,
        )
        for row in result.all()
    ]
    return DataResponse(data=data)


@router.get("/analytics/top-spenders")
async def get_top_spenders(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=10, le=100),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[AgentSpendingResponse]]:
    since = pendulum.now("UTC").subtract(days=days)
    result = await db.execute(
        select(
            Agent.agent_id,
            Agent.name,
            func.sum(CreditTransaction.amount).label("total_spent"),
            func.count(CreditTransaction.id).label("txn_count"),
        )
        .join(CreditTransaction, Agent.id == CreditTransaction.agent_id)
        .where(
            Agent.org_id == auth.org_id,
            CreditTransaction.type == CreditType.DEBIT.value,
            CreditTransaction.created_at >= since,
        )
        .group_by(Agent.agent_id, Agent.name)
        .order_by(func.sum(CreditTransaction.amount).desc())
        .limit(limit)
    )
    data = [
        AgentSpendingResponse(
            agent_id=row.agent_id,
            name=row.name,
            total_spent=row.total_spent,
            transaction_count=row.txn_count,
        )
        for row in result.all()
    ]
    return DataResponse(data=data)
