"""
Pure scoring rules behind the Saved (Claim Radar), History (Growth Path),
Trending (Newcomer Heat) and Settings (matcher) pages. No database access,
so each rule can be tested on its own.
"""
from datetime import datetime, timedelta

DIFFICULTY_ORDER = ["easy", "medium", "hard"]

# --- Claim Radar -----------------------------------------------------------

# A thread that grew this much since you saved it probably has someone on it.
CROWDED_NEW_COMMENTS = 3
CROWDED_TOTAL_COMMENTS = 12
STALE_AFTER_DAYS = 180

# Lower sorts first: open issues are the ones worth grabbing now.
CLAIM_PRIORITY = {"open": 0, "stale": 1, "crowded": 2, "gone": 3}


def claim_radar(
    state: str | None,
    comments_now: int,
    comments_at_save: int,
    created_at: datetime | None,
    now: datetime,
) -> dict:
    """How contested a saved issue looks: a status, a 0-100 heat and a one-line reason."""
    comments_now = comments_now or 0
    new_comments = max(0, comments_now - (comments_at_save or 0))
    heat = min(100, comments_now * 5 + new_comments * 15)

    if state == "closed":
        return {"status": "gone", "heat": 100, "new_comments": new_comments, "reason": "Closed, so it's no longer up for grabs"}
    if new_comments >= CROWDED_NEW_COMMENTS:
        reason = f"{new_comments} new comments since you saved it, so someone may be on it"
        return {"status": "crowded", "heat": heat, "new_comments": new_comments, "reason": reason}
    if comments_now >= CROWDED_TOTAL_COMMENTS:
        return {"status": "crowded", "heat": heat, "new_comments": new_comments, "reason": "Busy thread, so check nobody has claimed it"}
    if created_at is not None and now - created_at > timedelta(days=STALE_AFTER_DAYS) and comments_now <= 2:
        return {"status": "stale", "heat": heat, "new_comments": new_comments, "reason": "Quiet for months, so ask if it's still wanted"}
    return {"status": "open", "heat": heat, "new_comments": new_comments, "reason": "Few people on it, so it's a good one to grab"}


# --- Growth Path -----------------------------------------------------------

# A checked issue counts toward your level once the agent rates you this likely to land it.
READY_PROBABILITY = 0.6


def current_level(merged_difficulties: list[str | None], ready_difficulties: list[str | None]) -> str | None:
    """Highest difficulty you've merged a PR at, else the highest you were rated ready for."""
    for difficulties in (merged_difficulties, ready_difficulties):
        known = [DIFFICULTY_ORDER.index(d) for d in difficulties if d in DIFFICULTY_ORDER]
        if known:
            return DIFFICULTY_ORDER[max(known)]
    return None


def next_level(level: str | None) -> str:
    """One step up from level (hard stays hard); with no history, start at easy."""
    if level not in DIFFICULTY_ORDER:
        return "easy"
    return DIFFICULTY_ORDER[min(DIFFICULTY_ORDER.index(level) + 1, len(DIFFICULTY_ORDER) - 1)]


# --- Newcomer Heat ---------------------------------------------------------

# Weights per signal: a new contributor getting merged says the most about how
# welcoming a repo is, a fresh beginner issue says the most about opportunity.
HEAT_WEIGHTS = {"fresh_issues": 3, "merges": 1, "newcomers": 4}

HEAT_REASONS = {
    "fresh_issues": "New issues landing",
    "merges": "Merging fast",
    "newcomers": "Welcoming newcomers",
}


def heat_breakdown(fresh_issues: int, merges: int, newcomers: int) -> dict:
    """Weighted points per signal, the raw total, and which signal drives it."""
    points = {
        "fresh_issues": fresh_issues * HEAT_WEIGHTS["fresh_issues"],
        "merges": merges * HEAT_WEIGHTS["merges"],
        "newcomers": newcomers * HEAT_WEIGHTS["newcomers"],
    }
    total = sum(points.values())
    driver = max(points, key=points.get) if total else None
    return {"points": points, "total": total, "reason": HEAT_REASONS.get(driver)}


# --- Matcher preferences ---------------------------------------------------

BOOST_POINTS = 12
DIFFICULTY_STEP_PENALTY = 10
FRESH_DAYS = 30
FRESH_POINTS = 6
OLD_DAYS = 365


def adjusted_score(
    base: float,
    language: str | None,
    difficulty: str | None,
    created_at: datetime | None,
    prefs: dict,
    now: datetime,
) -> float | None:
    """Re-weight a relevance score (0-100) by the user's matcher preferences. None means muted."""
    lang = (language or "").casefold()
    if lang and lang in {l.casefold() for l in prefs.get("muted_languages", [])}:
        return None

    score = base
    if lang and lang in {l.casefold() for l in prefs.get("boosted_languages", [])}:
        score += BOOST_POINTS

    comfort = prefs.get("comfort_difficulty", "any")
    if comfort in DIFFICULTY_ORDER and difficulty in DIFFICULTY_ORDER:
        score -= DIFFICULTY_STEP_PENALTY * abs(DIFFICULTY_ORDER.index(difficulty) - DIFFICULTY_ORDER.index(comfort))

    if prefs.get("prefer_fresh") and created_at is not None:
        age = now - created_at
        if age <= timedelta(days=FRESH_DAYS):
            score += FRESH_POINTS
        elif age > timedelta(days=OLD_DAYS):
            score -= FRESH_POINTS

    return max(0.0, min(100.0, score))
