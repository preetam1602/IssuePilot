import uuid
from typing import Any

from qdrant_client.models import Distance, VectorParams, PointStruct

from app.config import settings
from app.rag.qdrant_client import get_qdrant_client

collection_name = settings.qdrant_issues_collection

VECTOR_SIZE = 384  # BAAI/bge-small-en-v1.5 embedding dimension


def issue_point_id(issue_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, issue_id))


def ensure_issue_collection():
    client = get_qdrant_client()
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def upsert_issue_embedding(issue_id: str, embedding: list[float]) -> None:
    client = get_qdrant_client()
    client.upsert(
        collection_name=collection_name,
        points=[
            PointStruct(
                id=issue_point_id(issue_id),
                vector=embedding,
                payload={"issue_id": issue_id},
            )
        ],
    )


def search_issues(query_embedding: list[float], top_k: int = 50) -> list[dict[str, Any]]:
    client = get_qdrant_client()
    results = client.query_points(
        collection_name=collection_name,
        query=query_embedding,
        limit=top_k,
        with_payload=True,
    )
    return [
        {"issue_id": point.payload["issue_id"], "similarity": point.score}
        for point in results.points
    ]
