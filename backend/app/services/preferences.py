from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Issue, Prediction, UserPreference
from app.services.insights import adjusted_score

DEFAULT_PREFS = {
    "boosted_languages": [],
    "muted_languages": [],
    "comfort_difficulty": "any",
    "prefer_fresh": False,
}

# Scoring keeps each user's top 50 candidates, so that's the pool preferences re-rank.
CANDIDATE_POOL = 50


def load_prefs(db: Session, user_id) -> dict:
    pref = db.get(UserPreference, user_id)
    if pref is None:
        return dict(DEFAULT_PREFS)
    return {
        "boosted_languages": pref.boosted_languages or [],
        "muted_languages": pref.muted_languages or [],
        "comfort_difficulty": pref.comfort_difficulty or "any",
        "prefer_fresh": bool(pref.prefer_fresh),
    }


def query_candidates(db: Session, user_id) -> list[tuple[Prediction, Issue]]:
    return db.execute(
        select(Prediction, Issue)
        .join(Issue, Issue.id == Prediction.issue_id)
        .where(
            Prediction.user_id == user_id,
            Prediction.relevance_score.isnot(None),
            Issue.state.is_distinct_from("closed"),
        )
        .order_by(Prediction.relevance_score.desc())
        .limit(CANDIDATE_POOL)
    ).all()


def rank_candidates(rows: list[tuple[Prediction, Issue]], prefs: dict) -> list[dict]:
    """
    Apply prefs to candidates already sorted by raw relevance. Each result keeps
    its raw rank, so the settings preview can show how far an issue moved.
    """
    now = datetime.now(timezone.utc)
    ranked = []
    for base_rank, (prediction, issue) in enumerate(rows, start=1):
        score = adjusted_score(prediction.relevance_score, issue.language, issue.difficulty, issue.created_at, prefs, now)
        if score is not None:
            ranked.append({"issue": issue, "score": score, "base_score": prediction.relevance_score, "base_rank": base_rank})
    # Stable sort: ties keep their raw relevance order.
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked
