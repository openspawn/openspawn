import httpx

OLLAMA_MODEL = "bge-m3"
OLLAMA_DIMENSIONS = 1024
OLLAMA_DEFAULT_ENDPOINT = "http://localhost:11434"


class OllamaProvider:
    dimensions: int = OLLAMA_DIMENSIONS
    model_name: str = OLLAMA_MODEL

    def __init__(
        self,
        endpoint: str = OLLAMA_DEFAULT_ENDPOINT,
        model: str = OLLAMA_MODEL,
    ) -> None:
        self.model_name = model
        self._endpoint = endpoint.rstrip("/")
        self._client = httpx.AsyncClient(timeout=30.0)

    async def embed(self, text: str) -> list[float]:
        response = await self._client.post(
            f"{self._endpoint}/api/embed",
            json={"model": self.model_name, "input": text},
        )
        response.raise_for_status()
        data = response.json()
        return data["embeddings"][0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.post(
            f"{self._endpoint}/api/embed",
            json={"model": self.model_name, "input": texts},
        )
        response.raise_for_status()
        data = response.json()
        return data["embeddings"]
