from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Prediction, User, UserSkill
from app.services.auth import get_current_user
from app.session import get_db

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skills = db.execute(select(UserSkill.language).where(UserSkill.user_id == user.id)).scalars().all()

    contributions = db.scalar(
        select(func.count())
        .select_from(ContributionEvent)
        .where(ContributionEvent.github_user_id == user.github_id)
    )

    recent_events = db.execute(
        select(ContributionEvent)
        .where(ContributionEvent.github_user_id == user.github_id)
        .order_by(ContributionEvent.event_at.desc())
        .limit(5)
    ).scalars().all()

    avg_success = db.scalar(
        select(func.avg(Prediction.success_prob))
        .where(Prediction.user_id == user.id, Prediction.success_prob.isnot(None))
    )

    return {
        "username": user.username,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "email": user.email,
        "location": None,
        "website": None,
        "twitter": None,
        "skills": skills,
        "saved_count": 0,
        "success_rate": round(avg_success * 100) if avg_success is not None else None,
        "stats": {
            "contributions": contributions or 0,
            "total_stars": 0,
            "avg_resolution_hours": None,
        },
        "languages": [],
        "recent_activity": [
            {
                "description": f"Merged PR #{event.pr_number} in {event.repo_full_name}",
                "date": event.event_at.isoformat(),
            }
            for event in recent_events
        ],
    }
