import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from app.core.config import settings

class LocalVectorStore:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.VECTOR_STORE_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_store_path(self, user_id: int) -> Path:
        user_dir = self.base_dir / f"user_{user_id}"
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir / "index.json"

    def _load_user_data(self, user_id: int) -> List[Dict[str, Any]]:
        path = self._get_user_store_path(user_id)
        if not path.exists():
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_user_data(self, user_id: int, items: List[Dict[str, Any]]) -> None:
        path = self._get_user_store_path(user_id)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False)

    def add_chunks(
        self,
        user_id: int,
        document_id: int,
        chunks: List[Dict[str, Any]],
        vectors: List[List[float]]
    ) -> None:
        items = self._load_user_data(user_id)
        # Remove any existing chunks for this document first
        items = [item for item in items if item.get("document_id") != document_id]

        for chunk, vector in zip(chunks, vectors):
            items.append({
                "document_id": document_id,
                "chunk_index": chunk.get("index", 0),
                "text": chunk.get("text", ""),
                "metadata": chunk.get("metadata", {}),
                "vector": vector
            })

        self._save_user_data(user_id, items)

    def delete_document_chunks(self, user_id: int, document_id: int) -> None:
        items = self._load_user_data(user_id)
        filtered = [item for item in items if item.get("document_id") != document_id]
        self._save_user_data(user_id, filtered)

    def similarity_search(
        self,
        user_id: int,
        query_vector: List[float],
        top_k: int = 4,
        min_score: float = 0.1
    ) -> List[Dict[str, Any]]:
        items = self._load_user_data(user_id)
        if not items or not query_vector:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        scored_items = []
        for item in items:
            v = item.get("vector")
            if not v:
                continue
            doc_vec = np.array(v, dtype=np.float32)
            d_norm = np.linalg.norm(doc_vec)
            if d_norm == 0:
                continue

            score = float(np.dot(q_vec, doc_vec) / (q_norm * d_norm))
            if score >= min_score:
                scored_items.append({
                    "text": item.get("text", ""),
                    "document_id": item.get("document_id"),
                    "chunk_index": item.get("chunk_index"),
                    "metadata": item.get("metadata", {}),
                    "score": score
                })

        # Sort descending by score
        scored_items.sort(key=lambda x: x["score"], reverse=True)
        return scored_items[:top_k]

# Singleton instance
vector_store = LocalVectorStore()
