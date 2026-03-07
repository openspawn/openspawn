import enum
import os

from app.memory.providers.base import EmbeddingProvider
from app.memory.providers.ollama import OllamaProvider
from app.memory.providers.openai_provider import OpenAIProvider
from app.memory.providers.voyage import VoyageProvider


class EmbeddingProviderName(enum.StrEnum):
    VOYAGE = "voyage"
    OPENAI = "openai"
    OLLAMA = "ollama"


def get_embedding_provider(
    provider_name: str | None = None,
) -> EmbeddingProvider:
    name = provider_name or os.environ.get("EMBEDDING_PROVIDER", EmbeddingProviderName.VOYAGE)

    match name:
        case EmbeddingProviderName.VOYAGE:
            return VoyageProvider()
        case EmbeddingProviderName.OPENAI:
            return OpenAIProvider()
        case EmbeddingProviderName.OLLAMA:
            endpoint = os.environ.get("OLLAMA_ENDPOINT", "http://localhost:11434")
            model = os.environ.get("OLLAMA_EMBEDDING_MODEL", "bge-m3")
            return OllamaProvider(endpoint=endpoint, model=model)
        case _:
            msg = f"Unknown embedding provider: {name}. Use: {', '.join(EmbeddingProviderName)}"
            raise ValueError(msg)
