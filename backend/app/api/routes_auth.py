import re
import secrets
from collections import Counter
from urllib.parse import urlencode, urlparse

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException
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

OAUTH_STATE_COOKIE = "issuepilot_oauth_state"

BARE_HOST = re.compile(r"^[\w.-]+(:\d+)?(/|$)")


def _safe_website(blog: str | None) -> str | None:
    """GitHub's blog field is free text that the profile page renders as a link, so only keep http(s) URLs."""
    blog = (blog or "").strip()
    if not blog:
        return None
    # A bare host ("example.com", "example.com:8080/me") gets https; anything
    # else must already carry its scheme, so "javascript:..." is never treated as a host.
    if BARE_HOST.match(blog):
        blog = f"https://{blog}"
    parsed = urlparse(blog)
    return blog if parsed.scheme in ("http", "https") and parsed.netloc else None


def _skill_level(repo_count: int) -> int:
    """1-3 from how many of the user's public repos use the language."""
    if repo_count >= 5:
        return 3
    if repo_count >= 2:
        return 2
    return 1


@router.get("/github")
def github_login():
    # The state round-trips through GitHub and must match this cookie on the
    # callback, so a callback the user didn't start themselves is rejected.
    state = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user",
        "state": state,
    }
    response = RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}")
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        state,
        max_age=600,
        httponly=True,
        samesite="lax",
        secure=settings.app_env != "development",
    )
    return response


@router.get("/callback")
def github_callback(
    code: str,
    state: str,
    expected_state: str | None = Cookie(None, alias=OAUTH_STATE_COOKIE),
    db: Session = Depends(get_db),
):
    if not expected_state or not secrets.compare_digest(state, expected_state):
        raise HTTPException(400, "Invalid OAuth state, please sign in again")

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
        "location": gh_user.get("location"),
        "website": _safe_website(gh_user.get("blog")),
        "twitter_username": gh_user.get("twitter_username"),
        # Stars on the user's own repos; forks would count other people's work.
        "total_stars": sum(repo.get("stargazers_count", 0) for repo in repos if not repo.get("fork")),
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
        count = language_counts[language]
        db.add(UserSkill(user_id=user_id, language=language, level=_skill_level(count), repo_count=count))

    db.commit()

    jwt_token = create_access_token(str(user_id))
    # The token goes in the fragment, which browsers never send to a server,
    # so it stays out of access logs and Referer headers.
    response = RedirectResponse(f"{settings.frontend_url}/#token={jwt_token}")
    response.delete_cookie(OAUTH_STATE_COOKIE)
    return response
