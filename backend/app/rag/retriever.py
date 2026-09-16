from typing import List, Dict, Any
from app.rag.embeddings import get_embedding_provider
from app.rag.vector_store import vector_store

class RAGRetriever:
    def __init__(self):
        self.embedding_provider = get_embedding_provider()
        self.vector_store = vector_store

    async def retrieve_relevant_chunks(
        self,
        user_id: int,
        query: str,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        query_vector = await self.embedding_provider.embed_query(query)
        chunks = self.vector_store.similarity_search(
            user_id=user_id,
            query_vector=query_vector,
            top_k=top_k
        )
        return chunks

retriever = RAGRetriever()
