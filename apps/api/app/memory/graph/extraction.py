"""LLM-based entity and relationship extraction from memories."""

from __future__ import annotations

import structlog
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential

logger = structlog.get_logger()

DEFAULT_MODEL = "anthropic/claude-haiku-4-5-20251001"
MIN_ENTITY_CONFIDENCE = 20

EXTRACTION_PROMPT = """Extract entities and relationships from this memory content.

Entities are people, tools, concepts, processes, systems, locations, or events mentioned.
Relationships connect two entities (e.g., "uses", "depends_on", "created_by").

For each entity:
- Provide a short name (lowercase, no articles)
- Classify as: person, tool, concept, process, system, location, or event
- Write a 1-sentence description
- Rate confidence 0-1 (lower if hedging language like "maybe", "I think")

For each relationship:
- Reference source and target entities by name
- Provide a relationship type (lowercase verb phrase)
- Rate weight 0-1 (strength of the relationship)

Content:
{content}"""


class ExtractedEntity(BaseModel):
    name: str
    entity_type: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)


class ExtractedRelationship(BaseModel):
    source: str
    target: str
    relationship_type: str
    weight: float = Field(ge=0.0, le=1.0, default=0.5)


class ExtractionResult(BaseModel):
    entities: list[ExtractedEntity] = Field(default_factory=list)
    relationships: list[ExtractedRelationship] = Field(default_factory=list)


def compute_entity_confidence(memory_confidences: list[int]) -> float:
    """Weighted average of linked memory confidences."""
    if not memory_confidences:
        return 50.0
    return sum(memory_confidences) / len(memory_confidences)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def extract_from_content(
    content: str,
    model: str = DEFAULT_MODEL,
) -> ExtractionResult:
    import instructor
    import litellm

    client = instructor.from_litellm(litellm.acompletion)
    try:
        result = await client.chat.completions.create(
            model=model,
            response_model=ExtractionResult,
            messages=[
                {"role": "user", "content": EXTRACTION_PROMPT.format(content=content)},
            ],
            max_tokens=1024,
        )
    except Exception:
        logger.warning("entity_extraction_failed", content_len=len(content))
        return ExtractionResult()
    return result
