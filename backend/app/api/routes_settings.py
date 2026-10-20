from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.api.routes_recommend import serialize_recommendation
from app.models import Issue, User, UserPreference, UserSkill
from app.services.auth import get_current_user
from app.services.preferences import load_prefs, query_candidates, rank_candidates
from app.session import get_db

router = APIRouter(prefix="/settings", tags=["Settings"])

PREVIEW_SIZE = 5
# Besides the user's own languages, offer the most common ones among open issues.
EXTRA_LANGUAGES = 12


class MatcherPrefs(BaseModel):
    boosted_languages: list[str] = Field(default_factory=list, max_length=10)
    muted_languages: list[str] = Field(default_factory=list, max_length=10)
    comfort_difficulty: Literal["any", "easy", "medium", "hard"] = "any"
    prefer_fresh: bool = False

    @field_validator("boosted_languages", "muted_languages")
    @classmethod
    def _clean(cls, languages: list[str]) -> list[str]:
        return list(dict.fromkeys(lang.strip()[:40] for lang in languages if lang.strip()))


def _available_languages(db: Session, user: User) -> list[str]:
    own = db.execute(
        select(UserSkill.language).where(UserSkill.user_id == user.id).order_by(UserSkill.repo_count.desc())
    ).scalars().all()
    common = db.execute(
        select(Issue.language)
        .where(Issue.language.isnot(None), Issue.state.is_distinct_from("closed"))
        .group_by(Issue.language)
        .order_by(func.count().desc())
        .limit(EXTRA_LANGUAGES)
    ).scalars().all()
    return list(dict.fromkeys([*own, *common]))


@router.get("/matcher")
def get_matcher(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"prefs": load_prefs(db, user.id), "languages": _available_languages(db, user)}


@router.put("/matcher")
def save_matcher(prefs: MatcherPrefs, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    values = prefs.model_dump()
    stmt = insert(UserPreference).values(user_id=user.id, **values)
    db.execute(stmt.on_conflict_do_update(index_elements=["user_id"], set_={**values, "updated_at": func.now()}))
    db.commit()
    return {"prefs": values}


@router.post("/matcher/preview")
def preview_matcher(prefs: MatcherPrefs, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Top recommendations under unsaved prefs, with each one's rank before the prefs applied."""
    ranked = rank_candidates(query_candidates(db, user.id), prefs.model_dump())[:PREVIEW_SIZE]
    return {
        "preview": [
            {**serialize_recommendation(item["issue"], item["score"]), "base_rank": item["base_rank"]}
            for item in ranked
        ]
    }
