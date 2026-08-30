from typing import Any

from app.rag.embed import embed_text
from app.rag.qdrant_client import (collection_name,get_qdrant_client)

def search_document(query:str,top_k:int=5)->list[dict[str,Any]]:
    query_vector=embed_text(query)
    client=get_qdrant_client()

    results=client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        with_payload=True
    )

    retrieved_chunks = []

    for result in results.points:

        retrieved_chunks.append(
            {
                "score": result.score,
                "chunk_id": result.payload.get("chunk_id"),
                "text": result.payload.get("text"),
                "metadata": {
                    key: value
                    for key, value in result.payload.items()
                    if key not in ("chunk_id", "text")
                },
            }
        )

    return retrieved_chunks