from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.session import get_db
from app.services.github_client import discover_repos
from app.services.ingestion import ingest_contribution_events, ingest_issues
from app.services.feature_loader import compute_and_store_features
from app.services.scorer import run_nightly_scoring
from app.schemas.admin import (
    BuildFeaturesResponse,
    IngestEventsResponse,
    IngestIssuesResponse,
    ScoreResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/ingest-issues", response_model=IngestIssuesResponse)
def admin_ingest_issues(db: Session = Depends(get_db)):
    repos_by_difficulty = discover_repos(settings.github_ingest_token)
    count = ingest_issues(db, repos_by_difficulty, settings.github_ingest_token)
    return {"issues_ingested": count}


@router.post("/ingest-events", response_model=IngestEventsResponse)
def admin_ingest_events(db: Session = Depends(get_db)):
    repos_by_difficulty = discover_repos(settings.github_ingest_token)
    all_repos = [repo for repos in repos_by_difficulty.values() for repo in repos]
    count = ingest_contribution_events(db, all_repos, settings.github_ingest_token)
    return {"events_ingested": count}


@router.post("/build-features", response_model=BuildFeaturesResponse)
def admin_build_features(db: Session = Depends(get_db)):
    count = compute_and_store_features(db)
    return {"issues_featurized": count}


@router.post("/score", response_model=ScoreResponse)
def admin_run_scoring(db: Session = Depends(get_db)):
    count = run_nightly_scoring(db)
    return {"scores_written": count}
