from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Prediction, User
from app.services.agent import predict_contribution
from app.services.auth import get_current_user
from app.session import get_db

router = APIRouter(prefix="/predict", tags=["Predict"])


class PredictRequest(BaseModel):
    issue_id: str


@router.post("")
def predict(body: PredictRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cached = db.execute(
        select(Prediction).where(Prediction.user_id == user.id, Prediction.issue_id == body.issue_id)
    ).scalar_one_or_none()

    if cached and cached.success_prob is not None:
        return {"success_probability": cached.success_prob, "difficulty": cached.difficulty_tag, "cached": True}

    result = predict_contribution(db, str(user.id), body.issue_id)

    stmt = insert(Prediction).values(
        user_id=user.id,
        issue_id=body.issue_id,
        success_prob=result["success_probability"],
        difficulty_tag=result["difficulty"],
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "issue_id"],
        set_={"success_prob": result["success_probability"], "difficulty_tag": result["difficulty"]},
    )
    db.execute(stmt)
    db.commit()

    return {**result, "cached": False}
