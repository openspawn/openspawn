"""Service layer for hosted API key management."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import func, select

from app.auth.middleware import hash_password, verify_password
from app.models.auth import ApiKey, User
from app.models.organization import Organization

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


def _generate_api_key() -> tuple[str, str, str]:
    """Generate an API key, returning (plaintext, prefix, sha256_hash)."""
    raw = secrets.token_urlsafe(32)
    plaintext = f"osp_{raw}"
    prefix = plaintext[:12]
    key_hash = hashlib.sha256(plaintext.encode("utf-8")).hexdigest()
    return plaintext, prefix, key_hash


async def register_user(
    email: str,
    password: str,
    name: str,
    db: AsyncSession,
) -> tuple[User, Organization, str]:
    """Create user, default org, and API key. Returns (user, org, plaintext_key)."""

    # Check if email already exists (across all orgs)
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create default org for the user
    slug = email.split("@")[0].lower().replace(".", "-").replace("+", "-")[:80]
    # Ensure unique slug
    slug_check = await db.execute(select(Organization).where(Organization.slug == slug))
    if slug_check.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    org = Organization(
        name=f"{name or email.split('@')[0]}'s Org",
        slug=slug,
    )
    db.add(org)
    await db.flush()

    # Create user
    user = User(
        org_id=org.id,
        email=email,
        password_hash=hash_password(password),
        name=name or email.split("@")[0],
        role="admin",
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    # Create API key
    plaintext, prefix, key_hash = _generate_api_key()
    api_key = ApiKey(
        org_id=org.id,
        user_id=user.id,
        name="Default API Key",
        key_prefix=prefix,
        key_hash=key_hash,
        scopes=["read", "write", "admin"],
    )
    db.add(api_key)
    await db.flush()

    return user, org, plaintext


async def login_user(
    email: str,
    password: str,
    db: AsyncSession,
) -> tuple[User, str]:
    """Authenticate and return (or create) an API key. Returns (user, plaintext_key)."""
    from fastapi import HTTPException, status

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Issue a new API key on each login (old ones stay valid)
    plaintext, prefix, key_hash = _generate_api_key()
    api_key = ApiKey(
        org_id=user.org_id,
        user_id=user.id,
        name="Login key",
        key_prefix=prefix,
        key_hash=key_hash,
        scopes=["read", "write", "admin"],
    )
    db.add(api_key)
    await db.flush()

    return user, plaintext


async def get_usage(user_id: uuid.UUID, db: AsyncSession) -> dict:
    """Return basic usage stats for a user."""
    from app.models.agent import Agent

    # Count orgs the user belongs to (via their API keys)
    org_result = await db.execute(
        select(func.count(func.distinct(ApiKey.org_id))).where(ApiKey.user_id == user_id)
    )
    org_count = org_result.scalar() or 0

    # Count agents across user's orgs
    user_orgs = await db.execute(
        select(func.distinct(ApiKey.org_id)).where(ApiKey.user_id == user_id)
    )
    org_ids = [row[0] for row in user_orgs.fetchall()]

    agent_count = 0
    if org_ids:
        agent_result = await db.execute(
            select(func.count(Agent.id)).where(Agent.org_id.in_(org_ids))
        )
        agent_count = agent_result.scalar() or 0

    # API call count from usage_tracking table (if exists), else 0
    api_calls = await _get_api_call_count(user_id, db)

    return {
        "user_id": user_id,
        "api_calls": api_calls,
        "org_count": org_count,
        "agent_count": agent_count,
    }


async def _get_api_call_count(user_id: uuid.UUID, db: AsyncSession) -> int:
    """Get API call count from usage_tracking table."""
    try:
        from app.models.usage import UsageCounter

        result = await db.execute(
            select(UsageCounter.call_count).where(UsageCounter.user_id == user_id)
        )
        return result.scalar() or 0
    except Exception:
        return 0
