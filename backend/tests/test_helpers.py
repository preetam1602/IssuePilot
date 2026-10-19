import time

import httpx
import pytest

from app.api.routes_auth import _safe_website, _skill_level
from app.api.routes_issues import _escape_like
from app.services.github_client import _rate_limit_wait


@pytest.mark.parametrize(
    "blog, expected",
    [
        (None, None),
        ("", None),
        ("example.com", "https://example.com"),
        ("http://example.com/me", "http://example.com/me"),
        ("javascript:alert(1)", None),
        ("javascript://alert(1)", None),
        ("ftp://example.com", None),
    ],
)
def test_safe_website(blog, expected):
    assert _safe_website(blog) == expected


@pytest.mark.parametrize("count, level", [(1, 1), (2, 2), (4, 2), (5, 3), (40, 3)])
def test_skill_level(count, level):
    assert _skill_level(count) == level


def test_escape_like():
    assert _escape_like("100%_a\\b") == "100\\%\\_a\\\\b"


def _response(status, **headers):
    return httpx.Response(status, headers=headers)


def test_rate_limit_wait():
    assert _rate_limit_wait(_response(200)) is None
    assert _rate_limit_wait(_response(404)) is None
    # A 403 that isn't a rate limit (e.g. a private repo) shouldn't be retried.
    assert _rate_limit_wait(_response(403, **{"x-ratelimit-remaining": "12"})) is None
    assert _rate_limit_wait(_response(429, **{"retry-after": "7"})) == 7
    reset = str(int(time.time()) + 60)
    wait = _rate_limit_wait(_response(403, **{"x-ratelimit-remaining": "0", "x-ratelimit-reset": reset}))
    assert 55 <= wait <= 62
