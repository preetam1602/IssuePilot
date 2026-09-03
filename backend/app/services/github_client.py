from datetime import datetime

import httpx

GITHUB_API = "https://api.github.com"

# Repo star-count ranges used as a proxy for contribution difficulty: smaller,
# less-trafficked repos are generally easier to get a PR merged into.
DIFFICULTY_TIERS = [
    ("easy", "stars:50..2000"),
    ("medium", "stars:2000..20000"),
    ("hard", "stars:>20000"),
]


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


def difficulty_for_stars(stars: int | None) -> str:
    """Classify a repo's difficulty tier from its actual star count (mirrors DIFFICULTY_TIERS)."""
    stars = stars or 0
    if stars > 20000:
        return "hard"
    if stars >= 2000:
        return "medium"
    return "easy"


def discover_repos(token: str, per_tier: int = 10) -> dict[str, list[str]]:
    """
    Discover repos across difficulty tiers via GitHub's search API, biased
    toward repos that actively tag "good first issue" work. Returns
    {"easy": [...], "medium": [...], "hard": [...]}.
    """
    repos_by_difficulty = {}
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for difficulty, star_range in DIFFICULTY_TIERS:
            resp = client.get(
                f"{GITHUB_API}/search/repositories",
                headers=_headers(token),
                params={
                    "q": f"good-first-issues:>0 {star_range}",
                    "sort": "stars",
                    "order": "desc",
                    "per_page": per_tier,
                },
            )
            resp.raise_for_status()
            items = resp.json().get("items", [])
            repos_by_difficulty[difficulty] = [item["full_name"] for item in items]
    return repos_by_difficulty


def parse_gh_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def fetch_repo_metadata(repo: str, token: str) -> dict:
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        resp = client.get(f"{GITHUB_API}/repos/{repo}", headers=_headers(token))
        resp.raise_for_status()
        return resp.json()


def fetch_issues(repo: str, token: str, per_page: int = 100, max_pages: int = 5) -> list[dict]:
    """Fetch open issues for a repo, excluding pull requests (GitHub's /issues endpoint includes both)."""
    issues = []
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            resp = client.get(
                f"{GITHUB_API}/repos/{repo}/issues",
                headers=_headers(token),
                params={"state": "open", "per_page": per_page, "page": page},
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            issues.extend(item for item in batch if "pull_request" not in item)
    return issues


def fetch_contribution_events(repo: str, token: str, max_pages: int = 10) -> list[dict]:
    """
    Fetches PullRequestEvents where merged=True.
    Each event is one resolved issue — data the prediction agent's tools will query.
    """
    events = []
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            resp = client.get(
                f"{GITHUB_API}/repos/{repo}/events",
                headers=_headers(token),
                params={"per_page": 100, "page": page},
            )
            if resp.status_code != 200:
                break
            batch = resp.json()
            if not batch:
                break
            for ev in batch:
                if ev.get("type") != "PullRequestEvent":
                    continue
                pr = ev["payload"].get("pull_request", {})
                if pr.get("merged"):
                    events.append({
                        "github_user_id": ev["actor"]["id"],
                        "repo_full_name": repo,
                        "pr_number": pr["number"],
                        "pr_merged": True,
                        "resolved": True,
                        "event_at": ev["created_at"],
                    })
    return events
