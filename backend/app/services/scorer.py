from datetime import datetime, timezone

from sqlalchemy import distinct, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Prediction, UserSkill
from app.services.retrieve import retrieve_candidates


def run_nightly_scoring(db: Session, user_id: str | None = None) -> int:
    """
    Pre-compute relevance scores for all active users x candidate issues.
    Pass user_id to score a single user on-demand (new user fallback).
    Upserts results into the predictions table.
    """
    scored_at = datetime.now(timezone.utc)

    if user_id:
        user_ids = [user_id]
    else:
        user_ids = [row[0] for row in db.execute(select(distinct(UserSkill.user_id)))]

    if not user_ids:
        return 0

    total = 0
    for uid in user_ids:
        skills = db.execute(select(UserSkill).where(UserSkill.user_id == uid)).scalars().all()
        if not skills:
            continue

        profile_text = ", ".join(
            f"{s.language} ({s.domain or 'general'}, level {s.level})" for s in skills
        )

        candidates = retrieve_candidates(db, profile_text, top_k=50)
        for c in candidates:
            relevance = max(0.0, min(100.0, round(c["similarity"] * 100, 2)))
            stmt = insert(Prediction).values(
                user_id=uid,
                issue_id=c["issue_id"],
                relevance_score=relevance,
                scored_at=scored_at,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["user_id", "issue_id"],
                set_={"relevance_score": relevance, "scored_at": scored_at},
            )
            db.execute(stmt)
            total += 1

    db.commit()
    return total
