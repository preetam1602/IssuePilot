from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Feature, Issue, Prediction, User
from app.services.auth import get_current_user
from app.services.scorer import run_nightly_scoring
from app.session import get_db

router = APIRouter(prefix="/recommend", tags=["Recommend"])


def _query_predictions(db: Session, user_id: str, limit: int):
    return db.execute(
        select(Prediction, Issue, Feature)
        .join(Issue, Issue.id == Prediction.issue_id)
        .outerjoin(Feature, Feature.issue_id == Issue.id)
        .where(Prediction.user_id == user_id)
        .order_by(Prediction.relevance_score.desc())
        .limit(limit)
    ).all()


@router.get("")
def get_recommendations(limit: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = _query_predictions(db, user.id, limit)

    if not rows:
        run_nightly_scoring(db, user_id=str(user.id))
        rows = _query_predictions(db, user.id, limit)

    recommendations = [
        {
            "issue_id": str(issue.id),
            "title": issue.title,
            "repo": issue.repo_full_name,
            "labels": issue.labels or [],
            "language": issue.language,
            "difficulty": issue.difficulty,
            "score": round(prediction.relevance_score or 0),
            "stars": issue.repo_stars or 0,
            "forks": issue.repo_forks or 0,
        }
        for prediction, issue, feature in rows
    ]

    return {"recommendations": recommendations}
