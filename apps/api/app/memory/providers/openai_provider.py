from openai import AsyncOpenAI

OPENAI_MODEL = "text-embedding-3-large"
OPENAI_DIMENSIONS = 1024
OPENAI_BATCH_SIZE = 2048


class OpenAIProvider:
    dimensions: int = OPENAI_DIMENSIONS
    model_name: str = OPENAI_MODEL

    def __init__(self, api_key: str | None = None) -> None:
        self._client = AsyncOpenAI(api_key=api_key)

    async def embed(self, text: str) -> list[float]:
        response = await self._client.embeddings.create(
            input=[text],
            model=self.model_name,
            dimensions=self.dimensions,
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), OPENAI_BATCH_SIZE):
            batch = texts[i : i + OPENAI_BATCH_SIZE]
            response = await self._client.embeddings.create(
                input=batch,
                model=self.model_name,
                dimensions=self.dimensions,
            )
            all_embeddings.extend([d.embedding for d in response.data])
        return all_embeddings
