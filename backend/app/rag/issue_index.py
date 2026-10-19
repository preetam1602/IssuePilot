import uuid
from typing import Any

from qdrant_client.models import Distance, PointStruct, QueryRequest, VectorParams

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


def upsert_issue_embeddings(items: list[tuple[str, list[float]]]) -> None:
    """Upsert (issue_id, embedding) pairs in a single Qdrant request."""
    if not items:
        return
    client = get_qdrant_client()
    client.upsert(
        collection_name=collection_name,
        points=[
            PointStruct(
                id=issue_point_id(issue_id),
                vector=embedding,
                payload={"issue_id": issue_id},
            )
            for issue_id, embedding in items
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


def search_issues_batch(query_embeddings: list[list[float]], top_k: int = 50) -> list[list[dict[str, Any]]]:
    """Run several searches in one Qdrant request; results line up with query_embeddings."""
    if not query_embeddings:
        return []
    client = get_qdrant_client()
    responses = client.query_batch_points(
        collection_name=collection_name,
        requests=[QueryRequest(query=embedding, limit=top_k, with_payload=True) for embedding in query_embeddings],
    )
    return [
        [{"issue_id": point.payload["issue_id"], "similarity": point.score} for point in response.points]
        for response in responses
    ]
