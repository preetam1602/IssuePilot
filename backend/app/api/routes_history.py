from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Feature, Issue, Prediction, User
from app.services.auth import get_current_user
from app.services.insights import READY_PROBABILITY, current_level, next_level
from app.session import get_db

router = APIRouter(prefix="/history", tags=["History"])

TIMELINE_LIMIT = 50


@router.get("")
def get_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    checked = db.execute(
        select(Prediction, Issue)
        .join(Issue, Issue.id == Prediction.issue_id)
        .where(Prediction.user_id == user.id, Prediction.predicted_at.isnot(None))
        .order_by(Prediction.predicted_at.desc())
        .limit(TIMELINE_LIMIT)
    ).all()

    merged = db.execute(
        select(ContributionEvent)
        .where(ContributionEvent.github_user_id == user.github_id, ContributionEvent.pr_merged.is_(True))
        .order_by(ContributionEvent.event_at.desc())
        .limit(TIMELINE_LIMIT)
    ).scalars().all()

    # A PR's difficulty is its repo's tier, which ingestion sets per repo from its stars.
    merged_repos = {event.repo_full_name for event in merged}
    tier_by_repo = (
        dict(db.execute(
            select(Issue.repo_full_name, Issue.difficulty)
            .where(Issue.repo_full_name.in_(merged_repos), Issue.difficulty.isnot(None))
            .distinct(Issue.repo_full_name)
        ).all())
        if merged_repos
        else {}
    )

    timeline = [
        {
            "kind": "checked",
            "date": prediction.predicted_at,
            "issue_id": str(issue.id),
            "title": issue.title,
            "repo": issue.repo_full_name,
            "difficulty": issue.difficulty,
            "success_prob": prediction.success_prob,
        }
        for prediction, issue in checked
    ] + [
        {
            "kind": "merged",
            "date": event.event_at,
            "issue_id": None,
            "title": f"Merged PR #{event.pr_number}",
            "repo": event.repo_full_name,
            "difficulty": tier_by_repo.get(event.repo_full_name),
            "success_prob": None,
        }
        for event in merged
    ]
    timeline.sort(key=lambda item: item["date"], reverse=True)

    level = current_level(
        [item["difficulty"] for item in timeline if item["kind"] == "merged"],
        [
            item["difficulty"]
            for item in timeline
            if item["kind"] == "checked" and (item["success_prob"] or 0) >= READY_PROBABILITY
        ],
    )
    target = next_level(level)

    # The next step is your best-matching recommendation at the target level
    # that you haven't already run a prediction on.
    step = db.execute(
        select(Prediction, Issue)
        .join(Issue, Issue.id == Prediction.issue_id)
        .where(
            Prediction.user_id == user.id,
            Prediction.relevance_score.isnot(None),
            Prediction.success_prob.is_(None),
            Issue.difficulty == target,
            Issue.state.is_distinct_from("closed"),
        )
        .order_by(Prediction.relevance_score.desc())
        .limit(1)
    ).first()
    if step is None:
        # None of your matches sit at that level yet: fall back to its most popular open issue.
        fallback = db.execute(
            select(Issue)
            .outerjoin(Feature, Feature.issue_id == Issue.id)
            .where(Issue.difficulty == target, Issue.state.is_distinct_from("closed"))
            .order_by(Feature.popularity_score.desc().nulls_last())
            .limit(1)
        ).scalar_one_or_none()
        step = (None, fallback) if fallback else None

    return {
        "level": level,
        "target_level": target,
        "next_step": (
            {
                "issue_id": str(step[1].id),
                "title": step[1].title,
                "repo": step[1].repo_full_name,
                "language": step[1].language,
                "difficulty": step[1].difficulty,
                "score": round(step[0].relevance_score) if step[0] else None,
            }
            if step
            else None
        ),
        "counts": {
            "checked": sum(1 for item in timeline if item["kind"] == "checked"),
            "merged": sum(1 for item in timeline if item["kind"] == "merged"),
        },
        "timeline": timeline,
    }
