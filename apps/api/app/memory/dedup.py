"""3-layer deduplication pipeline for memory writes.

Layer 1: SHA-256 content hash — instant, free
Layer 2: Vector similarity at 0.90 threshold — catches paraphrases
Layer 3: LLM decision (ADD/UPDATE/NOOP/CONFLICT) — semantic judgment
"""

from __future__ import annotations

import enum
import hashlib
import os
import uuid
from typing import TYPE_CHECKING

import instructor
import litellm
import structlog
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from tenacity import retry, stop_after_attempt, wait_exponential

from app.observability import get_langfuse

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.memory.providers.base import EmbeddingProvider

logger = structlog.get_logger()

SIMILARITY_THRESHOLD = 0.90
DEFAULT_DECISION_MODEL = "anthropic/claude-haiku-4-5-20251001"


class DedupAction(enum.StrEnum):
    ADD = "ADD"
    UPDATE = "UPDATE"
    NOOP = "NOOP"
    CONFLICT = "CONFLICT"


class DedupDecision(BaseModel):
    action: DedupAction = Field(description="What to do with the new memory")
    reasoning: str = Field(description="Brief explanation of the decision")
    merged_content: str | None = Field(
        default=None,
        description="Merged content if action is UPDATE",
    )


class DedupResult(BaseModel):
    action: DedupAction
    existing_memory_id: uuid.UUID | None = None
    merged_content: str | None = None
    reasoning: str = ""


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


async def check_hash_dedup(
    session: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    content_hash: str,
) -> uuid.UUID | None:
    """Layer 1: Check if exact content hash exists for this org/agent."""
    from app.models.memory import Memory

    result = await session.execute(
        select(Memory.id).where(
            Memory.org_id == org_id,
            Memory.agent_id == agent_id,
            Memory.content_hash == content_hash,
        )
    )
    row = result.scalar_one_or_none()
    return row


async def check_vector_dedup(
    session: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    embedding: list[float],
    threshold: float = SIMILARITY_THRESHOLD,
) -> tuple[uuid.UUID, str, float] | None:
    """Layer 2: Check if semantically similar memory exists (cosine > threshold)."""
    embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"

    result = await session.execute(
        text("""
            SELECT id, content, 1 - (embedding <=> :embedding::vector) as similarity
            FROM memories
            WHERE org_id = :org_id
              AND agent_id = :agent_id
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :embedding::vector
            LIMIT 1
        """),
        {
            "embedding": embedding_str,
            "org_id": str(org_id),
            "agent_id": str(agent_id),
        },
    )
    row = result.first()
    if row and row.similarity >= threshold:
        return (row.id, row.content, row.similarity)
    return None


DECISION_PROMPT = """You are a memory deduplication system. Compare these two memories and decide what to do.

EXISTING memory:
{existing_content}

NEW memory:
{new_content}

Rules:
- NOOP: new memory adds no new information
- UPDATE: new memory adds info to existing. Provide merged_content combining both.
- ADD: memories are about different topics, keep both
- CONFLICT: memories contradict each other, keep both and flag"""


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)
async def _llm_decide(existing_content: str, new_content: str) -> DedupDecision:
    model = os.environ.get("DEDUP_MODEL", DEFAULT_DECISION_MODEL)

    langfuse = get_langfuse()
    generation = None
    if langfuse:
        trace = langfuse.trace(
            name="dedup_llm_decide",
            input={"existing": existing_content[:200], "new": new_content[:200]},
        )
        generation = trace.generation(name="instructor_dedup", model=model)

    client = instructor.from_litellm(litellm.acompletion)
    result = await client.chat.completions.create(
        model=model,
        response_model=DedupDecision,
        messages=[
            {
                "role": "user",
                "content": DECISION_PROMPT.format(
                    existing_content=existing_content,
                    new_content=new_content,
                ),
            }
        ],
        max_tokens=512,
    )

    if generation:
        generation.end(output={"action": result.action, "reasoning": result.reasoning})

    return result


async def run_dedup_pipeline(
    session: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    content: str,
    embedding: list[float] | None,
    embedding_provider: EmbeddingProvider | None = None,
) -> DedupResult:
    """Run the 3-layer dedup pipeline. Returns action to take."""
    content_hash = compute_content_hash(content)

    # Layer 1: hash dedup
    existing_id = await check_hash_dedup(session, org_id, agent_id, content_hash)
    if existing_id:
        logger.info("dedup.hash_match", existing_id=str(existing_id))
        return DedupResult(
            action=DedupAction.NOOP, existing_memory_id=existing_id, reasoning="exact hash match"
        )

    # Layer 2: vector similarity (skip if no embedding)
    if embedding is None and embedding_provider is not None:
        embedding = await embedding_provider.embed(content)

    if embedding is not None:
        vector_match = await check_vector_dedup(session, org_id, agent_id, embedding)
        if vector_match:
            existing_id, existing_content, similarity = vector_match
            logger.info(
                "dedup.vector_match",
                existing_id=str(existing_id),
                similarity=f"{similarity:.3f}",
            )

            # Layer 3: LLM decision
            try:
                decision = await _llm_decide(existing_content, content)
                logger.info(
                    "dedup.llm_decision", action=decision.action, reasoning=decision.reasoning
                )
                return DedupResult(
                    action=decision.action,
                    existing_memory_id=existing_id,
                    merged_content=decision.merged_content,
                    reasoning=decision.reasoning,
                )
            except Exception:
                logger.exception("dedup.llm_failed, defaulting to ADD")
                return DedupResult(
                    action=DedupAction.ADD, reasoning="LLM decision failed, storing as new"
                )

    return DedupResult(action=DedupAction.ADD, reasoning="no duplicates found")
