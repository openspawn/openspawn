from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.auth.schemas import AuthenticatedAgent
from app.database import get_db
from app.messages.schemas import (
    ChannelResponse,
    CreateChannelDto,
    MessageResponse,
    SendDirectMessageDto,
    SendMessageDto,
)
from app.models.agent import Agent
from app.models.enums import ChannelType
from app.models.message import Channel, Message
from app.schemas import DataResponse

router = APIRouter(tags=["messages"])


# --- Channels ---


@router.post("/channels", status_code=status.HTTP_201_CREATED)
async def create_channel(
    dto: CreateChannelDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ChannelResponse]:
    # Check duplicate name
    existing = await db.execute(
        select(Channel).where(Channel.org_id == auth.org_id, Channel.name == dto.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Channel name already exists"
        )

    channel = Channel(
        org_id=auth.org_id,
        name=dto.name,
        type=dto.type.value,
        task_id=dto.task_id,
        metadata_=dto.metadata,
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    return DataResponse(data=ChannelResponse.model_validate(channel))


@router.get("/channels")
async def list_channels(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ChannelResponse]]:
    result = await db.execute(
        select(Channel).where(Channel.org_id == auth.org_id).order_by(Channel.created_at)
    )
    return DataResponse(data=[ChannelResponse.model_validate(c) for c in result.scalars().all()])


@router.get("/channels/{channel_id}")
async def get_channel(
    channel_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ChannelResponse]:
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.org_id == auth.org_id)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return DataResponse(data=ChannelResponse.model_validate(channel))


# --- Messages ---


@router.post("/messages", status_code=status.HTTP_201_CREATED)
async def send_message(
    dto: SendMessageDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[MessageResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    # Validate channel
    channel = await db.execute(
        select(Channel).where(Channel.id == dto.channel_id, Channel.org_id == auth.org_id)
    )
    if not channel.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    msg = Message(
        org_id=auth.org_id,
        channel_id=dto.channel_id,
        sender_id=auth.id,
        type=dto.type.value,
        body=dto.body,
        parent_message_id=dto.parent_message_id,
        metadata_=dto.metadata,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return DataResponse(data=MessageResponse.model_validate(msg))


@router.get("/messages")
async def list_messages(
    channel_id: uuid.UUID = Query(),
    limit: int = Query(default=50, le=200),
    before: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[MessageResponse]]:
    q = select(Message).where(Message.channel_id == channel_id, Message.org_id == auth.org_id)
    if before:
        # Get the created_at of the "before" message for cursor pagination
        ref = await db.execute(select(Message.created_at).where(Message.id == before))
        ref_time = ref.scalar_one_or_none()
        if ref_time:
            q = q.where(Message.created_at < ref_time)

    result = await db.execute(q.order_by(Message.created_at.desc()).limit(limit))
    messages = [MessageResponse.model_validate(m) for m in result.scalars().all()]
    return DataResponse(data=list(reversed(messages)))


@router.get("/messages/{message_id}")
async def get_message(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[MessageResponse]:
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.org_id == auth.org_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return DataResponse(data=MessageResponse.model_validate(msg))


@router.get("/messages/{message_id}/thread")
async def get_thread(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[MessageResponse]]:
    # Get parent + replies
    result = await db.execute(
        select(Message)
        .where(
            Message.org_id == auth.org_id,
            (Message.id == message_id) | (Message.parent_message_id == message_id),
        )
        .order_by(Message.created_at)
    )
    return DataResponse(data=[MessageResponse.model_validate(m) for m in result.scalars().all()])


# --- Direct Messages ---


@router.post("/dm", status_code=status.HTTP_201_CREATED)
async def send_dm(
    dto: SendDirectMessageDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[MessageResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    # Validate recipient
    recipient = await db.execute(
        select(Agent).where(Agent.id == dto.recipient_id, Agent.org_id == auth.org_id)
    )
    if not recipient.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")

    # Find or create DM channel
    dm_name = _dm_channel_name(auth.id, dto.recipient_id)
    result = await db.execute(
        select(Channel).where(Channel.org_id == auth.org_id, Channel.name == dm_name)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        channel = Channel(
            org_id=auth.org_id,
            name=dm_name,
            type=ChannelType.AGENT.value,
            metadata_={},
        )
        db.add(channel)
        await db.flush()

    msg = Message(
        org_id=auth.org_id,
        channel_id=channel.id,
        sender_id=auth.id,
        recipient_id=dto.recipient_id,
        type="text",
        body=dto.body,
        metadata_=dto.metadata,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return DataResponse(data=MessageResponse.model_validate(msg))


@router.get("/dm/{agent_id}")
async def get_dm_history(
    agent_id: uuid.UUID,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[MessageResponse]]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    dm_name = _dm_channel_name(auth.id, agent_id)
    channel_result = await db.execute(
        select(Channel).where(Channel.org_id == auth.org_id, Channel.name == dm_name)
    )
    channel = channel_result.scalar_one_or_none()
    if not channel:
        return DataResponse(data=[])

    result = await db.execute(
        select(Message)
        .where(Message.channel_id == channel.id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = [MessageResponse.model_validate(m) for m in result.scalars().all()]
    return DataResponse(data=list(reversed(messages)))


def _dm_channel_name(a: uuid.UUID, b: uuid.UUID) -> str:
    ids = sorted([str(a), str(b)])
    return f"dm:{ids[0]}:{ids[1]}"
