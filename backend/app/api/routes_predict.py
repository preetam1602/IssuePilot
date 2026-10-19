import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Issue, Prediction, User
from app.services.agent import gather_evidence, predict_contribution
from app.services.auth import get_current_user
from app.session import get_db

router = APIRouter(prefix="/predict", tags=["Predict"])


class PredictRequest(BaseModel):
    issue_id: uuid.UUID


@router.post("")
def predict(body: PredictRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, body.issue_id)
    if issue is None:
        raise HTTPException(404, "Issue not found")

    cached = db.execute(
        select(Prediction).where(Prediction.user_id == user.id, Prediction.issue_id == issue.id)
    ).scalar_one_or_none()

    # Reuse a stored prediction until it expires or the issue changes under it.
    if (
        cached
        and cached.success_prob is not None
        and cached.predicted_at is not None
        and cached.predicted_at > datetime.now(timezone.utc) - timedelta(hours=settings.prediction_ttl_hours)
        and (issue.fetched_at is None or cached.predicted_at >= issue.fetched_at)
    ):
        return {"success_probability": cached.success_prob, "difficulty": cached.difficulty_tag, "cached": True}

    evidence = gather_evidence(db, user, issue)
    # End the read transaction so its pooled connection isn't held through the LLM call.
    db.commit()

    result = predict_contribution(evidence)

    values = {
        "success_prob": result["success_probability"],
        "difficulty_tag": result["difficulty"],
        "predicted_at": func.now(),
    }
    stmt = insert(Prediction).values(user_id=user.id, issue_id=issue.id, **values)
    stmt = stmt.on_conflict_do_update(index_elements=["user_id", "issue_id"], set_=values)
    db.execute(stmt)
    db.commit()

    return {**result, "cached": False}
