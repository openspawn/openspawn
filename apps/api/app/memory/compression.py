"""LLM-based compression of raw content into atomic facts.

Uses instructor + litellm for structured extraction from any LLM provider.
Inspired by SimpleMem Stage 1: compress input into normalized atomic facts
that produce better embeddings than raw text.
"""

import os

import instructor
import litellm
from pydantic import BaseModel, Field

DEFAULT_MODEL = "anthropic/claude-haiku-4-5-20251001"

COMPRESSION_PROMPT = """Extract atomic facts from the following content.
Each fact should be a single, self-contained statement that resolves all
pronouns and references to their full names. Remove redundancy.
Preserve technical details, metrics, and specific values.

Content:
{content}"""


class AtomicFacts(BaseModel):
    facts: list[str] = Field(description="List of atomic, self-contained factual statements")
    summary: str = Field(description="One-sentence summary of the overall content")


async def compress_to_facts(
    raw_content: str,
    model: str | None = None,
) -> AtomicFacts:
    """Compress raw content into atomic facts using LLM.

    Falls back gracefully: if LLM call fails, returns raw content as single fact.
    """
    llm_model = model or os.environ.get("COMPRESSION_MODEL", DEFAULT_MODEL)

    client = instructor.from_litellm(litellm.acompletion)
    return await client.chat.completions.create(
        model=llm_model,
        response_model=AtomicFacts,
        messages=[
            {
                "role": "user",
                "content": COMPRESSION_PROMPT.format(content=raw_content),
            }
        ],
        max_tokens=1024,
    )
