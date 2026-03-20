"""Schemas for hosted API key management."""

from __future__ import annotations

import uuid

from pydantic import BaseModel, EmailStr, field_validator

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class HostedLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class RegisterResponse(BaseModel):
    user_id: uuid.UUID
    org_id: uuid.UUID
    api_key: str  # plaintext, shown only once
    message: str = "Account created. Save your API key — it won't be shown again."


class HostedLoginResponse(BaseModel):
    api_key: str
    user_id: uuid.UUID
    org_id: uuid.UUID


class WhoAmIResponse(BaseModel):
    user_id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str
    role: str


class UsageResponse(BaseModel):
    user_id: uuid.UUID
    api_calls: int
    org_count: int
    agent_count: int
