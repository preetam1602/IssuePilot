import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.models import Feature, Issue
from app.session import get_db

router = APIRouter(prefix="/issues", tags=["Issues"])


def serialize_summary(issue: Issue, feature: Feature | None) -> dict:
    score = round((feature.popularity_score or 0) * 100) if feature else 0
    return {
        "issue_id": str(issue.id),
        "title": issue.title,
        "repo": issue.repo_full_name,
        "labels": issue.labels or [],
        "language": issue.language,
        "difficulty": issue.difficulty,
        "score": score,
        "stars": issue.repo_stars or 0,
        "forks": issue.repo_forks or 0,
    }


def _escape_like(value: str) -> str:
    # Treat %, _ and \ in the user's search as literal characters.
    return value.replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_")


@router.get("")
def list_issues(
    search: str = Query("", max_length=200),
    difficulty: Literal["", "easy", "medium", "hard"] = "",
    sort: Literal["best_match", "newest", "difficulty_asc", "score_desc"] = "best_match",
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        select(Issue, Feature)
        .outerjoin(Feature, Feature.issue_id == Issue.id)
        .where(Issue.state.is_distinct_from("closed"))
    )
    search = search.strip()
    if search:
        like = f"%{_escape_like(search)}%"
        query = query.where(or_(Issue.title.ilike(like), Issue.repo_full_name.ilike(like)))
    if difficulty:
        query = query.where(Issue.difficulty == difficulty)

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    popularity = Feature.popularity_score.desc().nulls_last()
    if sort == "newest":
        order = [Issue.created_at.desc().nulls_last()]
    elif sort == "difficulty_asc":
        rank = case({"easy": 0, "medium": 1, "hard": 2}, value=Issue.difficulty, else_=3)
        order = [rank, popularity]
    elif sort == "score_desc" or not search:
        order = [popularity]
    else:
        # best_match with a search: title hits before repo-name-only hits.
        order = [Issue.title.ilike(f"%{_escape_like(search)}%").desc(), popularity]
    # Issue.id last keeps the order total, so pages never repeat or skip rows.
    rows = db.execute(query.order_by(*order, Issue.id).limit(limit).offset(offset)).all()

    return {
        "issues": [serialize_summary(issue, feature) for issue, feature in rows],
        "total": total,
    }


@router.get("/check")
@router.get("/duplicate-check")
def duplicate_check(repo: str, issue_number: int, db: Session = Depends(get_db)):
    # GitHub repo names are case-insensitive, so compare lowercased.
    issue = db.execute(
        select(Issue).where(
            func.lower(Issue.repo_full_name) == repo.strip().lower(),
            Issue.issue_number == issue_number,
        )
    ).scalars().first()

    return {
        "exists": issue is not None,
        "issue_id": str(issue.id) if issue else None,
        "repo": repo,
        "issue_number": issue_number,
    }


@router.get("/{issue_id}")
def get_issue(issue_id: uuid.UUID, db: Session = Depends(get_db)):
    issue = db.get(Issue, issue_id)
    if issue is None:
        raise HTTPException(404, "Issue not found")

    feature = db.execute(select(Feature).where(Feature.issue_id == issue_id)).scalar_one_or_none()

    return {
        "issue_id": str(issue.id),
        "title": issue.title,
        "repo_full_name": issue.repo_full_name,
        "body": issue.body,
        "labels": issue.labels or [],
        "language": issue.language,
        "comments_count": issue.comments_count,
        "created_at": issue.created_at,
        "complexity_score": feature.complexity_score if feature else None,
        "popularity_score": feature.popularity_score if feature else None,
        "url": issue.url or (
            f"https://github.com/{issue.repo_full_name}/issues/{issue.issue_number}"
            if issue.issue_number
            else f"https://github.com/{issue.repo_full_name}/issues"
        ),
    }
