import logging
from typing import List, Dict, Any
from app.rag.loader import DocumentLoader
from app.rag.chunker import TextChunker
from app.rag.embeddings import get_embedding_provider
from app.rag.vector_store import vector_store

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self):
        self.chunker = TextChunker(chunk_size=700, chunk_overlap=100)
        self.embedding_provider = get_embedding_provider()
        self.vector_store = vector_store

    async def ingest_document(
        self,
        file_path: str,
        user_id: int,
        document_id: int,
        filename: str
    ) -> List[Dict[str, Any]]:
        # 1. Extract text
        text = DocumentLoader.extract_text(file_path)
        if not text.strip():
            raise ValueError(f"Extracted empty text from {filename}")

        # 2. Chunk text
        metadata = {"filename": filename, "document_id": document_id}
        chunks = self.chunker.split_text(text, metadata=metadata)
        if not chunks:
            raise ValueError("No text chunks could be generated")

        # 3. Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        vectors = await self.embedding_provider.embed_documents(chunk_texts)

        # 4. Store in vector database
        self.vector_store.add_chunks(
            user_id=user_id,
            document_id=document_id,
            chunks=chunks,
            vectors=vectors
        )

        return chunks

    def remove_document(self, user_id: int, document_id: int) -> None:
        self.vector_store.delete_document_chunks(user_id, document_id)

rag_pipeline = RAGPipeline()
