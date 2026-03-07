from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ChannelType, MessageType

# --- Request schemas ---


class CreateChannelDto(BaseModel):
    name: str = Field(max_length=255)
    type: ChannelType
    task_id: uuid.UUID | None = None
    metadata: dict = Field(default_factory=dict)


class SendMessageDto(BaseModel):
    channel_id: uuid.UUID
    type: MessageType = MessageType.TEXT
    body: str
    parent_message_id: uuid.UUID | None = None
    metadata: dict = Field(default_factory=dict)


class SendDirectMessageDto(BaseModel):
    recipient_id: uuid.UUID
    body: str
    metadata: dict = Field(default_factory=dict)


# --- Response schemas ---


class ChannelResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    type: ChannelType
    task_id: uuid.UUID | None
    metadata: dict = Field(alias="metadata_")
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    channel_id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID | None
    type: MessageType
    body: str
    parent_message_id: uuid.UUID | None
    metadata: dict = Field(alias="metadata_")
    created_at: datetime


class ConversationResponse(BaseModel):
    agent_id: uuid.UUID
    agent_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int
