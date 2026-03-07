import voyageai

VOYAGE_MODEL = "voyage-3.5"
VOYAGE_DIMENSIONS = 1024
VOYAGE_BATCH_SIZE = 128


class VoyageProvider:
    dimensions: int = VOYAGE_DIMENSIONS
    model_name: str = VOYAGE_MODEL

    def __init__(self, api_key: str | None = None) -> None:
        self._client = voyageai.AsyncClient(api_key=api_key)  # pyright: ignore[reportPrivateImportUsage]

    async def embed(self, text: str) -> list[float]:
        result = await self._client.embed(
            texts=[text],
            model=self.model_name,
            input_type="document",
        )
        return [float(v) for v in result.embeddings[0]]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), VOYAGE_BATCH_SIZE):
            batch = texts[i : i + VOYAGE_BATCH_SIZE]
            result = await self._client.embed(
                texts=batch,
                model=self.model_name,
                input_type="document",
            )
            all_embeddings.extend([[float(v) for v in emb] for emb in result.embeddings])
        return all_embeddings
