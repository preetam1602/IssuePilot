from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Feature
from app.rag.embed import embed_text
from app.rag.issue_index import search_issues


def retrieve_candidates(db: Session, profile_text: str, top_k: int = 50) -> list[dict]:
    """Embed the user profile and pull the top_k nearest issues via Qdrant, joined with scalar features."""
    query_embedding = embed_text(profile_text)
    matches = search_issues(query_embedding, top_k=top_k)
    if not matches:
        return []

    similarity_by_id = {m["issue_id"]: m["similarity"] for m in matches}
    issue_ids = list(similarity_by_id.keys())

    features = db.execute(select(Feature).where(Feature.issue_id.in_(issue_ids))).scalars().all()

    return [
        {
            "issue_id": str(feature.issue_id),
            "complexity_score": feature.complexity_score,
            "popularity_score": feature.popularity_score,
            "similarity": similarity_by_id[str(feature.issue_id)],
        }
        for feature in features
    ]
