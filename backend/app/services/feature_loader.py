from sqlalchemy import Float, cast, func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Feature, Issue
from app.rag.embed import embed_text, embed_texts
from app.rag.issue_index import ensure_issue_collection, upsert_issue_embeddings

EMBED_CHUNK_SIZE = 256


def _issue_text(title: str, body: str | None, labels: list[str] | None) -> str:
    return f"{title}\n{body or ''}\n{' '.join(labels or [])}"


def compute_and_store_features(db: Session) -> int:
    """
    Embed issues that are new or changed since their features were last computed,
    then refresh the scalar scores for every issue. Returns the number embedded.
    """
    stale = db.execute(
        select(Issue.id, Issue.title, Issue.body, Issue.labels)
        .outerjoin(Feature, Feature.issue_id == Issue.id)
        .where(or_(Feature.id.is_(None), Feature.computed_at < Issue.fetched_at))
    ).all()

    if stale:
        ensure_issue_collection()
    for start in range(0, len(stale), EMBED_CHUNK_SIZE):
        chunk = stale[start:start + EMBED_CHUNK_SIZE]
        embeddings = embed_texts([_issue_text(row.title, row.body, row.labels) for row in chunk])
        upsert_issue_embeddings([(str(row.id), embedding) for row, embedding in zip(chunk, embeddings)])

    # Both scores are normalized against the current maximum, so they shift for
    # every issue whenever the max changes; recomputing them all is one statement.
    _upsert_scores(db)
    db.commit()
    return len(stale)


def embed_issue(db: Session, issue_id) -> bool:
    """Embed one issue and score it now, so it's recommendable before the next full build."""
    issue = db.get(Issue, issue_id)
    if issue is None:
        return False
    ensure_issue_collection()
    upsert_issue_embeddings([(str(issue.id), embed_text(_issue_text(issue.title, issue.body, issue.labels)))])
    _upsert_scores(db, Issue.id == issue.id)
    db.commit()
    return True


def _upsert_scores(db: Session, *where) -> None:
    max_stars, max_comments = db.execute(
        select(func.coalesce(func.max(Issue.repo_stars), 0), func.coalesce(func.max(Issue.comments_count), 0))
    ).one()
    scores = select(
        Issue.id,
        cast(func.coalesce(Issue.comments_count, 0), Float) / (max_comments + 1),
        cast(func.coalesce(Issue.repo_stars, 0), Float) / (max_stars + 1),
    ).where(*where)
    stmt = insert(Feature).from_select(["issue_id", "complexity_score", "popularity_score"], scores)
    stmt = stmt.on_conflict_do_update(
        index_elements=["issue_id"],
        set_={
            "complexity_score": stmt.excluded.complexity_score,
            "popularity_score": stmt.excluded.popularity_score,
            "computed_at": func.now(),
        },
    )
    db.execute(stmt)
