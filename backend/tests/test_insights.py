from datetime import datetime, timedelta, timezone

import pytest

from app.api.routes_settings import MatcherPrefs
from app.services.insights import adjusted_score, claim_radar, current_level, heat_breakdown, next_level

NOW = datetime(2026, 10, 20, tzinfo=timezone.utc)
NO_PREFS = {"boosted_languages": [], "muted_languages": [], "comfort_difficulty": "any", "prefer_fresh": False}


@pytest.mark.parametrize(
    "state, comments, at_save, age_days, status",
    [
        ("closed", 0, 0, 1, "gone"),
        ("open", 5, 1, 1, "crowded"),
        ("open", 15, 15, 1, "crowded"),
        ("open", 1, 1, 400, "stale"),
        ("open", 2, 2, 10, "open"),
        (None, 0, 0, None, "open"),
    ],
)
def test_claim_radar_status(state, comments, at_save, age_days, status):
    created = NOW - timedelta(days=age_days) if age_days is not None else None
    assert claim_radar(state, comments, at_save, created, NOW)["status"] == status


def test_claim_radar_heat_is_capped_and_counts_new_comments():
    assert claim_radar("open", 2, 0, NOW, NOW)["new_comments"] == 2
    assert claim_radar("open", 50, 0, NOW, NOW)["heat"] == 100


@pytest.mark.parametrize(
    "merged, ready, level",
    [
        ([], [], None),
        (["easy", "medium"], ["hard"], "medium"),
        ([None], ["easy", "hard"], "hard"),
    ],
)
def test_current_level_prefers_merged_work(merged, ready, level):
    assert current_level(merged, ready) == level


@pytest.mark.parametrize("level, target", [(None, "easy"), ("easy", "medium"), ("medium", "hard"), ("hard", "hard")])
def test_next_level(level, target):
    assert next_level(level) == target


def test_heat_breakdown_names_the_biggest_signal():
    result = heat_breakdown(fresh_issues=1, merges=2, newcomers=3)
    assert result["total"] == 3 + 2 + 12
    assert result["reason"] == "Welcoming newcomers"
    assert heat_breakdown(0, 0, 0) == {"points": {"fresh_issues": 0, "merges": 0, "newcomers": 0}, "total": 0, "reason": None}


def test_adjusted_score_muted_language_is_dropped_case_insensitively():
    assert adjusted_score(80, "Python", "easy", NOW, {**NO_PREFS, "muted_languages": ["python"]}, NOW) is None


def test_adjusted_score_boost_difficulty_and_freshness():
    prefs = {"boosted_languages": ["Go"], "muted_languages": [], "comfort_difficulty": "easy", "prefer_fresh": True}
    assert adjusted_score(50, "Go", "easy", NOW - timedelta(days=3), prefs, NOW) == 50 + 12 + 6
    assert adjusted_score(50, "Rust", "hard", NOW - timedelta(days=500), prefs, NOW) == 50 - 20 - 6
    assert adjusted_score(95, "Go", "easy", NOW, prefs, NOW) == 100
    assert adjusted_score(50, None, None, None, NO_PREFS, NOW) == 50


def test_matcher_prefs_dedupe_and_strip_languages():
    prefs = MatcherPrefs(boosted_languages=[" Go", "Go", "", "Rust "])
    assert prefs.boosted_languages == ["Go", "Rust"]


@pytest.mark.parametrize("method, path", [
    ("get", "/saved"), ("post", "/saved"), ("delete", "/saved/00000000-0000-0000-0000-000000000000"),
    ("get", "/history"), ("get", "/settings/matcher"), ("put", "/settings/matcher"), ("post", "/settings/matcher/preview"),
])
def test_personal_routes_require_token(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_trending_rejects_unsupported_window(client):
    assert client.get("/trending", params={"days": 0}).status_code == 422
