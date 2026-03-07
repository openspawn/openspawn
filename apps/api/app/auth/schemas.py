import uuid

from pydantic import BaseModel


class AuthenticatedAgent(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: str
    name: str
    role: str
    mode: str
    level: int


class AuthenticatedUser(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str
    role: str
    scopes: list[str] = []
    is_api_key: bool = False
