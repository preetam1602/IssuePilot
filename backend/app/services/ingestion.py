import logging

import httpx
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import ContributionEvent, Issue
from app.services.github_client import (
    DIFFICULTY_LEVELS,
    difficulty_for_stars,
    fetch_contribution_events,
    fetch_issues,
    fetch_repo_metadata,
    parse_gh_datetime,
)

logger = logging.getLogger(__name__)


def ingest_issues(db: Session, repos_by_difficulty: dict[str, list[str]], token: str) -> int:
    total = 0
    seen_repos = set()
    for repos in repos_by_difficulty.values():
        for repo in repos:
            if repo in seen_repos:
                continue
            seen_repos.add(repo)

            # One failing repo shouldn't throw away the rest of the run.
            try:
                repo_meta = fetch_repo_metadata(repo, token)
                issues, complete = fetch_issues(repo, token)
            except httpx.HTTPError:
                logger.exception("skipping %s: fetching its issues failed", repo)
                continue
            difficulty = difficulty_for_stars(repo_meta.get("stargazers_count", 0))

            # Keyed by GitHub id: an issue can appear on two pages if the listing
            # shifts mid-fetch, and Postgres rejects a duplicate key in one upsert.
            rows = {}
            for item in issues:
                rows[item["id"]] = {
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
                    "url": item.get("html_url"),
                    "created_at": parse_gh_datetime(item.get("created_at")),
                    "closed_at": parse_gh_datetime(item.get("closed_at")),
                }

            if rows:
                _adopt_pushed_issues(db, repo, rows)
                stmt = insert(Issue).values(list(rows.values()))
                update_values = {
                    column: stmt.excluded[column]
                    for column in next(iter(rows.values()))
                    if column != "github_issue_id"
                }
                # fetched_at marks the issue as changed, so build-features re-embeds it.
                update_values["fetched_at"] = func.now()
                stmt = stmt.on_conflict_do_update(index_elements=["github_issue_id"], set_=update_values)
                db.execute(stmt)

            # GitHub only lists open issues, so anything we hold for this repo that
            # is missing from a complete listing has been closed since.
            if complete:
                gone = [Issue.repo_full_name == repo, Issue.state == "open"]
                if rows:
                    gone.append(Issue.github_issue_id.notin_(list(rows)))
                db.execute(update(Issue).where(*gone).values(state="closed", fetched_at=func.now()))

            db.commit()
            total += len(rows)

    return total


def _adopt_pushed_issues(db: Session, repo: str, rows: dict[int, dict]) -> None:
    """
    Issues pushed through /admin/ingest-issue may lack a GitHub id. Give them
    the id from this fetch, so the upsert updates them instead of inserting a
    duplicate row for the same repo + number.
    """
    id_by_number = {row["issue_number"]: github_id for github_id, row in rows.items() if row["issue_number"] is not None}
    pushed = db.execute(
        select(Issue).where(
            func.lower(Issue.repo_full_name) == repo.lower(),
            Issue.github_issue_id.is_(None),
            Issue.issue_number.in_(list(id_by_number)),
        )
    ).scalars().all()
    for issue in pushed:
        issue.github_issue_id = id_by_number[issue.issue_number]
    if pushed:
        db.flush()


def upsert_single_issue(db: Session, payload) -> tuple[Issue, bool]:
    """Upsert one issue pushed by an external integration, matched on repo (case-insensitive) + issue number."""
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
        "fetched_at": func.now(),
    }
    if payload.github_issue_id is not None:
        values["github_issue_id"] = payload.github_issue_id

    created = issue is None
    if created:
        # Repo-star difficulty is unknown for a pushed issue, so fall back to
        # the LLM's assessment to keep it visible to the difficulty filter.
        llm_difficulty = (payload.difficulty or "").strip().lower()
        if llm_difficulty in DIFFICULTY_LEVELS:
            values["difficulty"] = llm_difficulty
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
        try:
            events = fetch_contribution_events(repo, token)
        except httpx.HTTPError:
            logger.exception("skipping %s: fetching its events failed", repo)
            continue

        # The events feed can repeat a PR (e.g. reopened and merged again).
        rows = {
            (event["github_user_id"], event["pr_number"]): {**event, "event_at": parse_gh_datetime(event["event_at"])}
            for event in events
        }
        if rows:
            stmt = insert(ContributionEvent).values(list(rows.values()))
            stmt = stmt.on_conflict_do_nothing(index_elements=["github_user_id", "repo_full_name", "pr_number"])
            db.execute(stmt)

        db.commit()
        total += len(rows)

    return total
