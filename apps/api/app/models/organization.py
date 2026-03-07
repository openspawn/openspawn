from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.task import Task


class Organization(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    task_prefix: Mapped[str] = mapped_column(String(20), nullable=False, server_default="TASK")
    next_task_number: Mapped[int] = mapped_column(nullable=False, server_default="1")
    settings: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")

    agents: Mapped[list[Agent]] = relationship(
        "Agent", back_populates="organization", lazy="select"
    )
    tasks: Mapped[list[Task]] = relationship("Task", back_populates="organization", lazy="select")
