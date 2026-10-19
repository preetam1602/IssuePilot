from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Prediction, User, UserSkill
from app.services.retrieve import retrieve_candidates_batch

# Users scored per embedding + Qdrant round trip.
USER_BATCH_SIZE = 64

# Used for users whose GitHub repos gave us no languages, so they still get
# recommendations instead of an empty dashboard.
FALLBACK_PROFILE = "beginner friendly good first issue, documentation, small bug fix"


def _profile_text(skills: list[UserSkill]) -> str:
    if not skills:
        return FALLBACK_PROFILE
    return ", ".join(f"{s.language} ({s.domain or 'general'}, level {s.level})" for s in skills)


def run_nightly_scoring(db: Session, user_id: str | None = None) -> int:
    """
    Pre-compute relevance scores for all users x candidate issues.
    Pass user_id to score a single user on-demand (new user fallback).
    Upserts results into the predictions table and retires the user's
    candidates that dropped out of their top results.
    """
    scored_at = datetime.now(timezone.utc)

    user_ids = [user_id] if user_id else list(db.execute(select(User.id)).scalars())

    total = 0
    for start in range(0, len(user_ids), USER_BATCH_SIZE):
        batch = user_ids[start:start + USER_BATCH_SIZE]

        skills_by_user = defaultdict(list)
        for skill in db.execute(select(UserSkill).where(UserSkill.user_id.in_(batch))).scalars():
            skills_by_user[str(skill.user_id)].append(skill)

        candidates_per_user = retrieve_candidates_batch(
            db, [_profile_text(skills_by_user[str(uid)]) for uid in batch], top_k=50
        )

        for uid, candidates in zip(batch, candidates_per_user):
            if candidates:
                stmt = insert(Prediction).values([
                    {
                        "user_id": uid,
                        "issue_id": c["issue_id"],
                        "relevance_score": max(0.0, min(100.0, round(c["similarity"] * 100, 2))),
                        "scored_at": scored_at,
                    }
                    for c in candidates
                ])
                stmt = stmt.on_conflict_do_update(
                    index_elements=["user_id", "issue_id"],
                    set_={"relevance_score": stmt.excluded.relevance_score, "scored_at": stmt.excluded.scored_at},
                )
                db.execute(stmt)
                total += len(candidates)

            # Anything not refreshed this run is no longer a top candidate. Rows that
            # only held a relevance score go; rows with a saved success prediction
            # stay (that's the /predict cache) but leave the recommendations.
            stale = (Prediction.user_id == uid, Prediction.scored_at < scored_at)
            db.execute(delete(Prediction).where(*stale, Prediction.success_prob.is_(None)))
            db.execute(update(Prediction).where(*stale).values(relevance_score=None))

        db.commit()

    return total
