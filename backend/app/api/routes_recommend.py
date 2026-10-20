from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models import Issue, User
from app.services.auth import get_current_user
from app.services.preferences import load_prefs, query_candidates, rank_candidates
from app.services.scorer import run_nightly_scoring
from app.session import get_db

router = APIRouter(prefix="/recommend", tags=["Recommend"])


def serialize_recommendation(issue: Issue, score: float) -> dict:
    return {
        "issue_id": str(issue.id),
        "title": issue.title,
        "repo": issue.repo_full_name,
        "labels": issue.labels or [],
        "language": issue.language,
        "difficulty": issue.difficulty,
        "score": round(score or 0),
        "stars": issue.repo_stars or 0,
        "forks": issue.repo_forks or 0,
    }


@router.get("")
def get_recommendations(limit: int = Query(20, ge=1, le=50), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = query_candidates(db, user.id)

    if not rows:
        run_nightly_scoring(db, user_id=str(user.id))
        rows = query_candidates(db, user.id)

    # Matcher preferences from Settings re-rank the scored candidates at read time.
    ranked = rank_candidates(rows, load_prefs(db, user.id))[:limit]

    return {"recommendations": [serialize_recommendation(item["issue"], item["score"]) for item in ranked]}
