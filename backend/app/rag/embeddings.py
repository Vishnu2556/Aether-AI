from abc import ABC, abstractmethod
import math
import re
import logging
from typing import List, Optional
import numpy as np
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class BaseEmbeddingProvider(ABC):
    @abstractmethod
    async def embed_query(self, text: str) -> List[float]:
        pass

    @abstractmethod
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass


class LocalHashEmbeddingProvider(BaseEmbeddingProvider):
    """
    High-performance zero-dependency dense embedding provider using
    subword n-grams, feature hashing (Murmur/FNV inspired), and TF-IDF weighting.
    Outputs a normalized 256-dimensional float vector.
    Enables instant RAG out-of-the-box without requiring gigabyte model downloads.
    """
    def __init__(self, dimension: int = 256):
        self.dim = dimension

    def _hash_token(self, token: str) -> int:
        h = 2166136261
        for char in token:
            h = (h ^ ord(char)) * 16777619
            h &= 0xFFFFFFFF
        return h % self.dim

    def _embed_single(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.dim

        vec = np.zeros(self.dim, dtype=np.float32)
        tokens = re.findall(r"\w+", text.lower())
        if not tokens:
            return vec.tolist()

        # Word tokens + character tri-grams
        features = list(tokens)
        for t in tokens:
            if len(t) >= 3:
                for i in range(len(t) - 2):
                    features.append(t[i:i+3])

        # Frequency weighting
        for feat in features:
            idx = self._hash_token(feat)
            vec[idx] += 1.0

        # Sublinear term frequency scaling (1 + log(tf))
        pos_mask = vec > 0
        vec[pos_mask] = 1.0 + np.log(vec[pos_mask])

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        return vec.tolist()

    async def embed_query(self, text: str) -> List[float]:
        return self._embed_single(text)

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_single(t) for t in texts]


class OllamaEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, base_url: Optional[str] = None, model: str = "nomic-embed-text"):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model
        self.fallback = LocalHashEmbeddingProvider()

    async def embed_query(self, text: str) -> List[float]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": text}
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("embedding", [])
        except Exception as e:
            logger.info(f"Ollama embeddings unavailable ({e}), using local embedding engine.")
        return await self.fallback.embed_query(text)

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        results = []
        for t in texts:
            emb = await self.embed_query(t)
            results.append(emb)
        return results


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-3-small"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        self.fallback = LocalHashEmbeddingProvider()

    async def embed_query(self, text: str) -> List[float]:
        if not self.api_key:
            return await self.fallback.embed_query(text)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": self.model, "input": text}
                )
                if res.status_code == 200:
                    return res.json()["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
        return await self.fallback.embed_query(text)

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key or not texts:
            return await self.fallback.embed_documents(texts)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": self.model, "input": texts}
                )
                if res.status_code == 200:
                    return [item["embedding"] for item in res.json()["data"]]
        except Exception as e:
            logger.error(f"OpenAI batch embeddings error: {e}")
        return await self.fallback.embed_documents(texts)


def get_embedding_provider() -> BaseEmbeddingProvider:
    if settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider()
    return OllamaEmbeddingProvider()
