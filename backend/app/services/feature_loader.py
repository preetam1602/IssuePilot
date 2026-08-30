from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Feature, Issue
from app.rag.embed import embed_texts
from app.rag.issue_index import ensure_issue_collection, upsert_issue_embedding


def _issue_text(issue: Issue) -> str:
    labels = " ".join(issue.labels or [])
    return f"{issue.title}\n{issue.body or ''}\n{labels}"


def compute_and_store_features(db: Session) -> int:
    issues = db.execute(select(Issue)).scalars().all()
    if not issues:
        return 0

    max_stars = max((issue.repo_stars or 0) for issue in issues)
    max_comments = max((issue.comments_count or 0) for issue in issues)

    texts = [_issue_text(issue) for issue in issues]
    embeddings = embed_texts(texts)

    ensure_issue_collection()

    for issue, embedding in zip(issues, embeddings):
        complexity_score = (issue.comments_count or 0) / (max_comments + 1)
        popularity_score = (issue.repo_stars or 0) / (max_stars + 1)

        stmt = insert(Feature).values(
            issue_id=issue.id,
            complexity_score=complexity_score,
            popularity_score=popularity_score,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["issue_id"],
            set_={"complexity_score": complexity_score, "popularity_score": popularity_score},
        )
        db.execute(stmt)
        upsert_issue_embedding(str(issue.id), embedding)

    db.commit()
    return len(issues)
