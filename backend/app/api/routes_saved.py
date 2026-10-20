import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Issue, Prediction, SavedIssue, User
from app.services.auth import get_current_user
from app.services.insights import CLAIM_PRIORITY, claim_radar
from app.session import get_db

router = APIRouter(prefix="/saved", tags=["Saved"])


class SaveRequest(BaseModel):
    issue_id: uuid.UUID


@router.get("")
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(SavedIssue, Issue, Prediction.success_prob)
        .join(Issue, Issue.id == SavedIssue.issue_id)
        .outerjoin(Prediction, (Prediction.issue_id == Issue.id) & (Prediction.user_id == user.id))
        .where(SavedIssue.user_id == user.id)
    ).all()

    now = datetime.now(timezone.utc)
    items = []
    for saved, issue, success_prob in rows:
        radar = claim_radar(issue.state, issue.comments_count, saved.comments_at_save, issue.created_at, now)
        items.append({
            "issue_id": str(issue.id),
            "title": issue.title,
            "repo": issue.repo_full_name,
            "language": issue.language,
            "difficulty": issue.difficulty,
            "comments_count": issue.comments_count or 0,
            "success_prob": success_prob,
            "saved_at": saved.saved_at,
            # Comment counts refresh with each issue ingest, so the radar is as of then.
            "checked_at": issue.fetched_at,
            **radar,
        })

    # Grab-first order: open field before contested, then your best odds, then the quietest.
    items.sort(key=lambda i: (CLAIM_PRIORITY[i["status"]], -(i["success_prob"] or 0), i["heat"]))
    return {"saved": items}


@router.post("", status_code=status.HTTP_201_CREATED)
def save_issue(body: SaveRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issue = db.get(Issue, body.issue_id)
    if issue is None:
        raise HTTPException(404, "Issue not found")

    # Saving twice keeps the original snapshot, so "new comments" still counts from the first save.
    stmt = insert(SavedIssue).values(user_id=user.id, issue_id=issue.id, comments_at_save=issue.comments_count or 0)
    db.execute(stmt.on_conflict_do_nothing(index_elements=["user_id", "issue_id"]))
    db.commit()
    return {"issue_id": str(issue.id), "saved": True}


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_issue(issue_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(delete(SavedIssue).where(SavedIssue.user_id == user.id, SavedIssue.issue_id == issue_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
