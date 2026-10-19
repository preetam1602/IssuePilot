import logging
from collections.abc import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.config import settings
from app.jobs import acquire_job_slot, run_job, score_job, weekly_reindex_job

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def _scheduled(name: str, job: Callable[[Session], object]) -> Callable[[], None]:
    def run():
        slot = acquire_job_slot()
        if slot is None:
            logger.info("%s: skipped, another worker or job holds the lock", name)
            return
        run_job(name, job, slot)
    return run


def start_scheduler():
    if not settings.scheduler_enabled or scheduler.running:
        return
    scheduler.add_job(_scheduled("nightly_score", score_job), "cron", hour=2, minute=0, id="nightly_score", replace_existing=True)
    scheduler.add_job(_scheduled("weekly_reindex", weekly_reindex_job), "cron", day_of_week="sun", hour=3, id="weekly_reindex", replace_existing=True)
    scheduler.start()
