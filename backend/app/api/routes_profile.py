from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Prediction, User, UserSkill
from app.services.auth import get_current_user
from app.session import get_db

router = APIRouter(prefix="/profile", tags=["Profile"])

# GitHub's colors for common languages; anything else gets the fallback.
LANGUAGE_COLORS = {
    "Python": "#3572A5",
    "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6",
    "Java": "#b07219",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "C": "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    "Ruby": "#701516",
    "PHP": "#4F5D95",
    "Swift": "#F05138",
    "Kotlin": "#A97BFF",
    "Dart": "#00B4AB",
    "Shell": "#89e051",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Jupyter Notebook": "#DA5B0B",
}
FALLBACK_LANGUAGE_COLOR = "#8b949e"


@router.get("")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skills = db.execute(
        select(UserSkill).where(UserSkill.user_id == user.id).order_by(UserSkill.repo_count.desc())
    ).scalars().all()
    total_repos = sum(skill.repo_count for skill in skills)

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
        "location": user.location,
        "website": user.website,
        "twitter": user.twitter_username,
        "skills": [skill.language for skill in skills],
        "saved_count": 0,
        "success_rate": round(avg_success * 100) if avg_success is not None else None,
        "stats": {
            "contributions": contributions or 0,
            "total_stars": user.total_stars or 0,
            "avg_resolution_hours": None,
        },
        "languages": [
            {
                "name": skill.language,
                "percent": round(skill.repo_count * 100 / total_repos),
                "color": LANGUAGE_COLORS.get(skill.language, FALLBACK_LANGUAGE_COLOR),
            }
            for skill in skills
            if total_repos
        ],
        "recent_activity": [
            {
                "description": f"Merged PR #{event.pr_number} in {event.repo_full_name}",
                "date": event.event_at.isoformat(),
            }
            for event in recent_events
        ],
    }
