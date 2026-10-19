import logging
from collections.abc import Callable

from sqlalchemy import Connection, text
from sqlalchemy.orm import Session

from app.config import settings
from app.session import SessionLocal, engine
from app.services.feature_loader import compute_and_store_features, embed_issue
from app.services.github_client import discover_repos
from app.services.ingestion import ingest_contribution_events, ingest_issues
from app.services.scorer import run_nightly_scoring

logger = logging.getLogger(__name__)

# Every job reads and writes the same issue/feature/prediction tables, so only
# one runs at a time. A Postgres advisory lock makes that hold across uvicorn
# workers and processes, not just threads: each worker starts its own scheduler,
# and whichever claims the lock first runs the job while the rest skip it.
JOB_LOCK_KEY = 0x1559E_701  # arbitrary, just unique to IssuePilot


def acquire_job_slot() -> Connection | None:
    """Claim the job lock. Returns the connection holding it, or None if another job has it."""
    conn = engine.connect()
    try:
        acquired = conn.execute(text("SELECT pg_try_advisory_lock(:key)"), {"key": JOB_LOCK_KEY}).scalar()
        conn.commit()
    except Exception:
        conn.close()
        raise
    if not acquired:
        conn.close()
        return None
    return conn


def release_job_slot(slot: Connection) -> None:
    try:
        slot.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": JOB_LOCK_KEY})
        slot.commit()
    finally:
        # Closing returns the connection to the pool; the session-level lock is
        # released above, or by Postgres if the connection itself was lost.
        slot.close()


def run_job(name: str, job: Callable[[Session], object], slot: Connection) -> None:
    """Run job with its own DB session, then release the slot from acquire_job_slot()."""
    db = SessionLocal()
    try:
        result = job(db)
        logger.info("%s: done (%s)", name, result)
    except Exception:
        logger.exception("%s failed", name)
    finally:
        db.close()
        release_job_slot(slot)


def embed_issue_task(issue_id) -> None:
    """Background task for a single pushed issue. Small and idempotent, so it skips the job lock."""
    db = SessionLocal()
    try:
        embed_issue(db, issue_id)
    except Exception:
        logger.exception("embedding issue %s failed", issue_id)
    finally:
        db.close()


def _all_repos(repos_by_difficulty: dict[str, list[str]]) -> list[str]:
    return [repo for repos in repos_by_difficulty.values() for repo in repos]


def ingest_issues_job(db: Session) -> int:
    return ingest_issues(db, discover_repos(settings.github_ingest_token), settings.github_ingest_token)


def ingest_events_job(db: Session) -> int:
    repos = _all_repos(discover_repos(settings.github_ingest_token))
    return ingest_contribution_events(db, repos, settings.github_ingest_token)


def build_features_job(db: Session) -> int:
    return compute_and_store_features(db)


def score_job(db: Session) -> int:
    return run_nightly_scoring(db)


def weekly_reindex_job(db: Session) -> str:
    repos_by_difficulty = discover_repos(settings.github_ingest_token)
    # Step 1: refresh open issues (and close the ones that disappeared)
    issues = ingest_issues(db, repos_by_difficulty, settings.github_ingest_token)
    # Step 2: refresh contribution events (grounds the prediction agent's tools)
    events = ingest_contribution_events(db, _all_repos(repos_by_difficulty), settings.github_ingest_token)
    # Step 3: embed new or changed issues into the Qdrant collection
    embedded = compute_and_store_features(db)
    # Step 4: immediately re-score with the refreshed index
    scores = run_nightly_scoring(db)
    return f"{issues} issues, {events} events, {embedded} embedded, {scores} scores"
