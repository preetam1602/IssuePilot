from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.session import SessionLocal
from app.services.feature_loader import compute_and_store_features
from app.services.github_client import discover_repos
from app.services.ingestion import ingest_contribution_events
from app.services.scorer import run_nightly_scoring

scheduler = BackgroundScheduler()


def nightly_score():
    db = SessionLocal()
    try:
        count = run_nightly_scoring(db)
        print(f"Scorer: {count} scores written")
    finally:
        db.close()


def weekly_reindex():
    db = SessionLocal()
    try:
        # Step 1: refresh contribution events (grounds the prediction agent's tools)
        repos_by_difficulty = discover_repos(settings.github_ingest_token)
        all_repos = [repo for repos in repos_by_difficulty.values() for repo in repos]
        ingest_contribution_events(db, all_repos, settings.github_ingest_token)
        # Step 2: re-embed any new or updated issues into the Qdrant collection
        compute_and_store_features(db)
        # Step 3: immediately re-score with the refreshed index
        run_nightly_scoring(db)
        print("Weekly reindex + rescore complete.")
    finally:
        db.close()


def start_scheduler():
    if not settings.scheduler_enabled or scheduler.running:
        return
    scheduler.add_job(nightly_score, "cron", hour=2, minute=0, id="nightly_score", replace_existing=True)
    scheduler.add_job(weekly_reindex, "cron", day_of_week="sun", hour=3, id="weekly_reindex", replace_existing=True)
    scheduler.start()
