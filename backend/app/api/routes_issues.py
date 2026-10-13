from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
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


@router.get("")
def list_issues(
    search: str = "",
    difficulty: str = "",
    sort: str = "best_match",
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = select(Issue)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Issue.title.ilike(like), Issue.repo_full_name.ilike(like)))
    if difficulty:
        query = query.where(Issue.difficulty == difficulty)

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    if sort == "newest":
        query = query.order_by(Issue.created_at.desc())

    issues = db.execute(query.limit(limit).offset(offset)).scalars().all()

    issue_ids = [issue.id for issue in issues]
    features = {
        f.issue_id: f
        for f in db.execute(select(Feature).where(Feature.issue_id.in_(issue_ids))).scalars()
    }

    return {
        "issues": [serialize_summary(issue, features.get(issue.id)) for issue in issues],
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
def get_issue(issue_id: str, db: Session = Depends(get_db)):
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
        "url": f"https://github.com/{issue.repo_full_name}/issues",
    }
