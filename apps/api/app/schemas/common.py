from __future__ import annotations

import uuid
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta


class DataResponse(BaseModel, Generic[T]):
    data: T


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class DataMessageResponse(BaseModel, Generic[T]):
    data: T
    message: str
    success: bool = True


# Common query param defaults
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 50
MAX_LIMIT = 200


# Reusable base schemas
class OrgScopedBase(BaseModel):
    org_id: uuid.UUID


class TimestampBase(BaseModel):
    created_at: datetime
    updated_at: datetime


class TimestampCreatedBase(BaseModel):
    created_at: datetime
