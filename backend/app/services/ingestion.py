from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Issue
from app.services.github_client import (
    difficulty_for_stars,
    fetch_contribution_events,
    fetch_issues,
    fetch_repo_metadata,
    parse_gh_datetime,
)


def ingest_issues(db: Session, repos_by_difficulty: dict[str, list[str]], token: str) -> int:
    total = 0
    seen_repos = set()
    for repos in repos_by_difficulty.values():
        for repo in repos:
            if repo in seen_repos:
                continue
            seen_repos.add(repo)

            repo_meta = fetch_repo_metadata(repo, token)
            issues = fetch_issues(repo, token)
            difficulty = difficulty_for_stars(repo_meta.get("stargazers_count", 0))

            for item in issues:
                values = {
                    "github_issue_id": item["id"],
                    "issue_number": item.get("number"),
                    "repo_full_name": repo,
                    "title": item["title"],
                    "body": item.get("body"),
                    "labels": [label["name"] for label in item.get("labels", [])],
                    "state": item.get("state"),
                    "comments_count": item.get("comments", 0),
                    "repo_stars": repo_meta.get("stargazers_count", 0),
                    "repo_forks": repo_meta.get("forks_count", 0),
                    "language": repo_meta.get("language"),
                    "difficulty": difficulty,
                    "created_at": parse_gh_datetime(item.get("created_at")),
                    "closed_at": parse_gh_datetime(item.get("closed_at")),
                }
                stmt = insert(Issue).values(**values)
                update_values = {k: v for k, v in values.items() if k != "github_issue_id"}
                stmt = stmt.on_conflict_do_update(index_elements=["github_issue_id"], set_=update_values)
                db.execute(stmt)

            db.commit()
            total += len(issues)

    return total



def upsert_single_issue(db: Session, payload) -> tuple[Issue, bool]:
    """Upsert one issue pushed from n8n, matched on repo (case-insensitive) + issue number."""
    issue = db.execute(
        select(Issue).where(
            func.lower(Issue.repo_full_name) == payload.repository.strip().lower(),
            Issue.issue_number == payload.number,
        )
    ).scalars().first()

    values = {
        "issue_number": payload.number,
        "repo_full_name": payload.repository.strip(),
        "title": payload.title,
        "body": payload.description,
        "url": payload.url,
        "state": payload.state,
        "labels": payload.labels,
        "created_at": payload.created_at,
        "llm_difficulty": payload.difficulty,
        "llm_required_skills": payload.required_skills,
        "llm_category": payload.category,
        "llm_potential_blockers": payload.potential_blockers,
    }
    if payload.github_issue_id is not None:
        values["github_issue_id"] = payload.github_issue_id

    created = issue is None
    if created:
        issue = Issue(**values)
        db.add(issue)
    else:
        for key, value in values.items():
            setattr(issue, key, value)

    db.commit()
    db.refresh(issue)
    return issue, created


def ingest_contribution_events(db: Session, repos: list[str], token: str) -> int:
    total = 0
    for repo in repos:
        events = fetch_contribution_events(repo, token)

        for event in events:
            values = {**event, "event_at": parse_gh_datetime(event["event_at"])}
            stmt = insert(ContributionEvent).values(**values)
            stmt = stmt.on_conflict_do_nothing(index_elements=["github_user_id", "pr_number"])
            db.execute(stmt)

        db.commit()
        total += len(events)

    return total
