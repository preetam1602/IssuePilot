import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.config import settings

client=QdrantClient(
    host=settings.qdrant_host,
    port=settings.qdrant_port
)

collection_name=settings.qdrant_collection

VECTOR_SIZE=384  # BAAI/bge-small-en-v1.5 embedding dimension

def get_qdrant_client()->QdrantClient:
    return client

def collection_exists()->bool:
    return client.collection_exists(collection_name)

def ensure_collection():
    if not collection_exists():
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )

def upsert_chunks(
    chunks: list[dict[str, Any]],
) -> None:

    points = []

    for chunk in chunks:

        # Qdrant point ids must be an unsigned int or a UUID, so the
        # human-readable chunk_id is hashed into a deterministic UUID
        # (re-ingesting the same document updates the same points).
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, chunk["chunk_id"]))

        points.append(
            PointStruct(
                id=point_id,
                vector=chunk["embedding"],
                payload={
                    "chunk_id": chunk["chunk_id"],
                    "text": chunk["text"],
                    **chunk["metadata"],
                },
            )
        )

    if points:
        client.upsert(
            collection_name=collection_name,
            points=points,
        )