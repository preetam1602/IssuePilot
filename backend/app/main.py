import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.scheduler import start_scheduler
from app.api.routes_health import router as health_router
from app.api.routes_rag import router as rag_router
from app.api.routes_admin import router as admin_router
from app.api.routes_auth import router as auth_router
from app.api.routes_issues import router as issues_router
from app.api.routes_recommend import router as recommend_router
from app.api.routes_predict import router as predict_router
from app.api.routes_profile import router as profile_router

logging.basicConfig(level=logging.DEBUG if settings.debug else logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_scheduler()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(rag_router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(issues_router)
app.include_router(recommend_router)
app.include_router(predict_router)
app.include_router(profile_router)

@app.get("/")
def root():
    return {
        "message": "IssuePilot API"
    }