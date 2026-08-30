from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.session import get_db
from app.rag.qdrant_setup import check_qdrant


router = APIRouter()


@router.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {
        "database": "connected",
        "result": result.scalar()
    }


@router.get("/health/qdrant")
def qdrant_health():
    return check_qdrant()