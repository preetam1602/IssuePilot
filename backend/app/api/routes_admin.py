from collections.abc import Callable

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.jobs import (
    acquire_job_slot,
    build_features_job,
    embed_issue_task,
    ingest_events_job,
    ingest_issues_job,
    run_job,
    score_job,
)
from app.session import get_db
from app.services.auth import require_admin
from app.services.ingestion import upsert_single_issue
from app.schemas.admin import IngestIssueRequest, IngestIssueResponse, JobStartedResponse

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


def _start(background_tasks: BackgroundTasks, name: str, job: Callable[[Session], object]) -> dict:
    # These jobs take minutes, so they run after the response is sent; the
    # result is printed to the server log.
    slot = acquire_job_slot()
    if slot is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Another ingestion or scoring job is already running")
    background_tasks.add_task(run_job, name, job, slot)
    return {"job": name, "status": "started"}


@router.post("/ingest-issues", response_model=JobStartedResponse, status_code=status.HTTP_202_ACCEPTED)
def admin_ingest_issues(background_tasks: BackgroundTasks):
    return _start(background_tasks, "ingest_issues", ingest_issues_job)


@router.post("/ingest-issue", response_model=IngestIssueResponse)
def admin_ingest_issue(payload: IngestIssueRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    issue, created = upsert_single_issue(db, payload)
    background_tasks.add_task(embed_issue_task, issue.id)
    return {"id": issue.id, "created": created}


@router.post("/ingest-events", response_model=JobStartedResponse, status_code=status.HTTP_202_ACCEPTED)
def admin_ingest_events(background_tasks: BackgroundTasks):
    return _start(background_tasks, "ingest_events", ingest_events_job)


@router.post("/build-features", response_model=JobStartedResponse, status_code=status.HTTP_202_ACCEPTED)
def admin_build_features(background_tasks: BackgroundTasks):
    return _start(background_tasks, "build_features", build_features_job)


@router.post("/score", response_model=JobStartedResponse, status_code=status.HTTP_202_ACCEPTED)
def admin_run_scoring(background_tasks: BackgroundTasks):
    return _start(background_tasks, "score", score_job)
