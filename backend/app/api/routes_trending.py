from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Issue
from app.services.insights import heat_breakdown
from app.session import get_db

router = APIRouter(prefix="/trending", tags=["Trending"])

BEGINNER_LABELS = ["%good first issue%", "%beginner%", "%help wanted%", "%easy%"]


@router.get("")
def get_trending(
    # GitHub's events feed only reaches back 90 days.
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Repos ranked by momentum for newcomers rather than stars: issues opened in
    the window (beginner-labelled ones count double), PRs merged in it, and
    contributors whose first merge we've seen in that repo landed in it.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    labels_text = func.lower(func.array_to_string(Issue.labels, ","))
    is_beginner = or_(*(labels_text.like(pattern) for pattern in BEGINNER_LABELS))
    fresh, beginner = {}, {}
    for repo, total, beginner_count in db.execute(
        select(Issue.repo_full_name, func.count(), func.count().filter(is_beginner))
        .where(Issue.state.is_distinct_from("closed"), Issue.created_at >= since)
        .group_by(Issue.repo_full_name)
    ).all():
        fresh[repo], beginner[repo] = total, beginner_count

    merges = dict(db.execute(
        select(ContributionEvent.repo_full_name, func.count())
        .where(ContributionEvent.pr_merged.is_(True), ContributionEvent.event_at >= since)
        .group_by(ContributionEvent.repo_full_name)
    ).all())

    first_merge = (
        select(
            ContributionEvent.repo_full_name,
            ContributionEvent.github_user_id,
            func.min(ContributionEvent.event_at).label("first_at"),
        )
        .where(ContributionEvent.pr_merged.is_(True))
        .group_by(ContributionEvent.repo_full_name, ContributionEvent.github_user_id)
        .subquery()
    )
    newcomers = dict(db.execute(
        select(first_merge.c.repo_full_name, func.count())
        .where(first_merge.c.first_at >= since)
        .group_by(first_merge.c.repo_full_name)
    ).all())

    scored = []
    for repo in set(fresh) | set(merges) | set(newcomers):
        breakdown = heat_breakdown(
            fresh.get(repo, 0) + beginner.get(repo, 0), merges.get(repo, 0), newcomers.get(repo, 0)
        )
        scored.append((repo, breakdown, fresh.get(repo, 0), merges.get(repo, 0), newcomers.get(repo, 0)))
    scored.sort(key=lambda row: row[1]["total"], reverse=True)
    scored = scored[:limit]

    meta = {}
    if scored:
        meta = {
            repo: (language, stars, difficulty)
            for repo, language, stars, difficulty in db.execute(
                select(Issue.repo_full_name, Issue.language, Issue.repo_stars, Issue.difficulty)
                .where(Issue.repo_full_name.in_([row[0] for row in scored]))
                .distinct(Issue.repo_full_name)
            ).all()
        }

    top = scored[0][1]["total"] if scored else 0
    return {
        "days": days,
        "repos": [
            {
                "repo": repo,
                "language": meta.get(repo, (None, 0, None))[0],
                "stars": meta.get(repo, (None, 0, None))[1] or 0,
                "difficulty": meta.get(repo, (None, 0, None))[2],
                # Relative to the hottest repo in the window, so the leader is always 100.
                "heat": round(breakdown["total"] * 100 / top) if top else 0,
                "points": breakdown["points"],
                "reason": breakdown["reason"],
                "fresh_issues": fresh_count,
                "beginner_issues": beginner.get(repo, 0),
                "merges": merge_count,
                "newcomers": newcomer_count,
            }
            for repo, breakdown, fresh_count, merge_count, newcomer_count in scored
        ],
    }
