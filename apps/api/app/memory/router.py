from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.memory.schemas import (
    ContradictionPairResponse,
    MemoryFeedbackDto,
    MemoryResponse,
    ResolveContradictionDto,
    SearchResultResponse,
    StoreMemoryDto,
)
from app.memory.service import RateLimitExceededError, list_memories, record_feedback, store_memory
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def store(
    dto: StoreMemoryDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    try:
        memory_id = await store_memory(
            session=db,
            org_id=auth.org_id,
            agent_id=auth.id,
            content=dto.content,
            source=dto.source,
            memory_type=dto.type,
            visibility=dto.visibility,
            target_agent_ids=dto.target_agent_ids,
            occurred_at=dto.occurred_at.isoformat() if dto.occurred_at else None,
            expires_at=dto.expires_at.isoformat() if dto.expires_at else None,
            metadata=dto.metadata,
        )
        await db.commit()
        return DataMessageResponse(
            data={"memory_id": str(memory_id)},
            message="Memory stored",
        )
    except RateLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=e.detail,
        ) from e


@router.get("/search")
async def search(
    query: str = Query(max_length=2000),
    type: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=10, ge=1, le=100),
    similarity_threshold: float = Query(default=0.7, ge=0.0, le=1.0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[SearchResultResponse]]:
    # Import here to avoid circular deps until all branches merge
    try:
        from app.memory.search import hybrid_search

        results = await hybrid_search(
            session=db,
            org_id=auth.org_id,
            query_text=query,
            requesting_agent_id=auth.id,
            limit=limit,
            similarity_threshold=similarity_threshold,
            memory_type=type,
        )
        return DataResponse(
            data=[SearchResultResponse.model_validate(r.model_dump()) for r in results]
        )
    except ImportError:
        return DataResponse(data=[])


@router.get("")
async def list_all(
    agent_id: uuid.UUID | None = Query(default=None),
    type: str | None = Query(default=None, alias="type"),
    visibility: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[MemoryResponse]:
    memories, total = await list_memories(
        session=db,
        org_id=auth.org_id,
        agent_id=agent_id,
        memory_type=type,
        visibility=visibility,
        limit=limit,
        offset=offset,
    )
    return PaginatedResponse(
        data=[MemoryResponse.model_validate(m) for m in memories],
        meta=PaginationMeta(total=total, page=(offset // limit) + 1, limit=limit),
    )


@router.get("/contradictions")
async def list_contradiction_pairs(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ContradictionPairResponse]]:
    from app.memory.contradictions import list_contradictions

    pairs = await list_contradictions(auth.org_id, db)
    return DataResponse(
        data=[
            ContradictionPairResponse(
                older_memory=MemoryResponse.model_validate(older),
                newer_memory=MemoryResponse.model_validate(newer),
            )
            for older, newer in pairs
        ]
    )


@router.post("/contradictions/{memory_id}/resolve")
async def resolve_contradiction_endpoint(
    memory_id: uuid.UUID,
    dto: ResolveContradictionDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    from app.memory.contradictions import ResolutionStrategy, resolve_contradiction

    try:
        strategy = ResolutionStrategy(dto.strategy)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategy. Must be one of: {[s.value for s in ResolutionStrategy]}",
        ) from e

    mem = await resolve_contradiction(memory_id, strategy, db)
    if not mem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    await db.commit()
    return DataMessageResponse(
        data={"memory_id": str(memory_id)},
        message=f"Contradiction resolved: {strategy.value}",
    )


@router.get("/{memory_id}")
async def get_one(
    memory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[MemoryResponse]:
    from app.memory.service import get_memory

    memory = await get_memory(db, memory_id, auth.org_id)
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    return DataResponse(data=MemoryResponse.model_validate(memory))


@router.post("/{memory_id}/feedback")
async def feedback(
    memory_id: uuid.UUID,
    dto: MemoryFeedbackDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    found = await record_feedback(db, memory_id, auth.org_id, dto.helpful)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    await db.commit()
    kind = "helpful" if dto.helpful else "unhelpful"
    return DataMessageResponse(
        data={"memory_id": str(memory_id)}, message=f"Feedback recorded: {kind}"
    )
