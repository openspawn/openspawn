from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID
from app.models.enums import TaskPriority, TaskStatus


class Task(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_org_id_identifier", "org_id", "identifier", unique=True),
        Index("ix_tasks_org_id_status", "org_id", "status"),
        Index("ix_tasks_org_id_assignee_id", "org_id", "assignee_id"),
        Index("ix_tasks_org_id_priority", "org_id", "priority"),
        Index("ix_tasks_org_id_status_assignee_id", "org_id", "status", "assignee_id"),
        Index("ix_tasks_parent_task_id", "parent_task_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    identifier: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=TaskStatus.BACKLOG.value
    )
    priority: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default=TaskPriority.NORMAL.value
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=True
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    parent_task_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=True
    )
    approval_required: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    autonomy_level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    required_capabilities: Mapped[list] = mapped_column(
        CompatJSONB(), nullable=False, server_default="[]"
    )
    sla_warning_sent_at: Mapped[datetime | None] = mapped_column(nullable=True)
    needs_attention: Mapped[bool] = mapped_column(nullable=False, server_default="false")

    # A2A fields
    source: Mapped[str] = mapped_column(String(20), nullable=False, server_default="manual")
    a2a_context_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    a2a_messages: Mapped[dict | None] = mapped_column(CompatJSONB(), nullable=True)

    organization: Mapped[Organization] = relationship("Organization", back_populates="tasks")
    assignee: Mapped[Agent | None] = relationship(
        "Agent", foreign_keys=[assignee_id], back_populates="assigned_tasks"
    )
    creator: Mapped[Agent] = relationship(
        "Agent", foreign_keys=[creator_id], back_populates="created_tasks"
    )
    parent_task: Mapped[Task | None] = relationship(
        "Task", remote_side="Task.id", back_populates="subtasks"
    )
    subtasks: Mapped[list[Task]] = relationship("Task", back_populates="parent_task")
    tags: Mapped[list[TaskTag]] = relationship("TaskTag", back_populates="task")
    comments: Mapped[list[TaskComment]] = relationship("TaskComment", back_populates="task")
    dependencies: Mapped[list[TaskDependency]] = relationship(
        "TaskDependency", foreign_keys="TaskDependency.task_id", back_populates="task"
    )
    dependents: Mapped[list[TaskDependency]] = relationship(
        "TaskDependency", foreign_keys="TaskDependency.depends_on_id", back_populates="depends_on"
    )


class TaskDependency(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "task_dependencies"
    __table_args__ = (
        Index(
            "ix_task_dependencies_task_id_depends_on_id", "task_id", "depends_on_id", unique=True
        ),
        Index("ix_task_dependencies_task_id", "task_id"),
        Index("ix_task_dependencies_depends_on_id", "depends_on_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), ForeignKey("tasks.id"), nullable=False)
    depends_on_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=False
    )
    blocking: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on: Mapped[Task] = relationship(
        "Task", foreign_keys=[depends_on_id], back_populates="dependents"
    )


class TaskTag(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "task_tags"
    __table_args__ = (
        Index("ix_task_tags_task_id_tag", "task_id", "tag", unique=True),
        Index("ix_task_tags_org_id_tag", "org_id", "tag"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), ForeignKey("tasks.id"), nullable=False)
    tag: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task", back_populates="tags")


class TaskComment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "task_comments"
    __table_args__ = (
        Index("ix_task_comments_task_id_created_at", "task_id", "created_at"),
        Index("ix_task_comments_parent_comment_id", "parent_comment_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), ForeignKey("tasks.id"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    parent_comment_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("task_comments.id"), nullable=True
    )

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task", back_populates="comments")
    author: Mapped[Agent] = relationship("Agent")
    parent_comment: Mapped[TaskComment | None] = relationship(
        "TaskComment", remote_side="TaskComment.id", back_populates="replies"
    )
    replies: Mapped[list[TaskComment]] = relationship(
        "TaskComment", back_populates="parent_comment"
    )


# Avoid circular imports
from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
