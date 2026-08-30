from collections import Counter
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User, UserSkill
from app.services.auth import create_access_token
from app.session import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_REPOS_URL = "https://api.github.com/users/{username}/repos"


@router.get("/github")
def github_login():
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user",
    }
    return RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}")


@router.get("/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    with httpx.Client(timeout=15.0) as client:
        token_resp = client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(400, "GitHub authentication failed")

        user_resp = client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        user_resp.raise_for_status()
        gh_user = user_resp.json()

        repos_resp = client.get(
            GITHUB_REPOS_URL.format(username=gh_user["login"]),
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params={"per_page": 100, "sort": "updated"},
        )
        repos = repos_resp.json() if repos_resp.status_code == 200 else []

    values = {
        "github_id": gh_user["id"],
        "username": gh_user["login"],
        "email": gh_user.get("email"),
        "avatar_url": gh_user.get("avatar_url"),
        "bio": gh_user.get("bio"),
    }
    stmt = insert(User).values(**values)
    update_values = {k: v for k, v in values.items() if k != "github_id"}
    stmt = stmt.on_conflict_do_update(index_elements=["github_id"], set_=update_values).returning(User.id)
    user_id = db.execute(stmt).scalar_one()

    # Derive skills from the languages of the user's public repos. If GitHub
    # returns nothing usable, this just leaves user_skills empty rather than
    # inventing anything.
    language_counts = Counter(repo["language"] for repo in repos if repo.get("language"))
    top_languages = [language for language, _ in language_counts.most_common(5)]

    db.execute(delete(UserSkill).where(UserSkill.user_id == user_id))
    for language in top_languages:
        db.add(UserSkill(user_id=user_id, language=language, level=2))

    db.commit()

    jwt_token = create_access_token(str(user_id))
    return RedirectResponse(f"{settings.frontend_url}/?token={jwt_token}")
