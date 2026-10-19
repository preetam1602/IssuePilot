from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Feature
from app.rag.embed import embed_texts
from app.rag.issue_index import search_issues_batch


def retrieve_candidates_batch(db: Session, profile_texts: list[str], top_k: int = 50) -> list[list[dict]]:
    """
    Embed each profile and pull its top_k nearest issues via Qdrant, keeping only
    issues that have features. Results line up with profile_texts.
    """
    matches_per_profile = search_issues_batch(embed_texts(profile_texts), top_k=top_k)

    issue_ids = {m["issue_id"] for matches in matches_per_profile for m in matches}
    if not issue_ids:
        return [[] for _ in profile_texts]
    featured = {
        str(issue_id)
        for issue_id in db.execute(select(Feature.issue_id).where(Feature.issue_id.in_(issue_ids))).scalars()
    }

    return [
        [m for m in matches if m["issue_id"] in featured]
        for matches in matches_per_profile
    ]
