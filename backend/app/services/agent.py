from datetime import datetime, timezone
from typing import Literal

from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.errors import GraphRecursionError
from langgraph.prebuilt import create_react_agent
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ContributionEvent, Feature, Issue, User, UserSkill

model = ChatGroq(
    model=settings.agent_model,
    api_key=settings.groq_api_key,
    timeout=settings.agent_timeout_seconds,
    max_retries=2,
)


def _user_contribution_history(db: Session, user: User) -> dict:
    merged_prs, repos = db.execute(
        select(
            func.count().filter(ContributionEvent.pr_merged),
            func.array_agg(func.distinct(ContributionEvent.repo_full_name)),
        ).where(ContributionEvent.github_user_id == user.github_id)
    ).one()
    skills = db.execute(
        select(UserSkill.language, UserSkill.level).where(UserSkill.user_id == user.id)
    ).all()

    return {
        "total_merged_prs": merged_prs,
        "repos_contributed_to": sorted(repos or []),
        "languages": [{"language": language, "level": level} for language, level in skills],
        # History only covers repos IssuePilot tracks, so zero merged PRs here
        # doesn't mean the user has never contributed anywhere.
        "history_scope": "merged PRs in tracked repos over roughly the last 90 days",
    }


def _issue_complexity(db: Session, issue: Issue) -> dict:
    feature = db.execute(select(Feature).where(Feature.issue_id == issue.id)).scalar_one_or_none()

    days_open = None
    if issue.created_at:
        end = issue.closed_at or datetime.now(timezone.utc)
        days_open = (end - issue.created_at).days

    return {
        "repo": issue.repo_full_name,
        "language": issue.language,
        "repo_difficulty_tier": issue.difficulty,
        "repo_stars": issue.repo_stars,
        "complexity_score": feature.complexity_score if feature else None,
        "popularity_score": feature.popularity_score if feature else None,
        "comments_count": issue.comments_count,
        "days_open": days_open,
        "labels": issue.labels,
        "required_skills": issue.llm_required_skills,
        "potential_blockers": issue.llm_potential_blockers,
    }


def gather_evidence(db: Session, user: User, issue: Issue) -> dict:
    """Collect everything the agent's tools expose, so the DB isn't needed during the LLM call."""
    return {
        "user": _user_contribution_history(db, user),
        "issue": _issue_complexity(db, issue),
    }


def predict_contribution(evidence: dict) -> dict:
    # The tools take no IDs: they're bound to this one user/issue pair, so the
    # model can't fetch anyone else's data by passing a different ID.
    @tool
    def get_user_contribution_history() -> dict:
        """Fetch the contributor's languages, merged-PR history and the repos they've contributed to."""
        return evidence["user"]

    @tool
    def get_issue_complexity() -> dict:
        """Fetch complexity, activity and required-skill signals for the issue."""
        return evidence["issue"]

    @tool
    def submit_prediction(probability: float, difficulty: Literal["easy", "medium", "hard"], rationale: str = "") -> str:
        """Submit the final probability (0 to 1) and difficulty tag for this user/issue pair."""
        return "recorded"

    agent = create_react_agent(
        model=model,
        tools=[get_user_contribution_history, get_issue_complexity, submit_prediction],
    )

    try:
        result = agent.invoke(
            {"messages": [{
                "role": "user",
                "content": (
                    "Assess whether this contributor is likely to successfully resolve this "
                    "GitHub issue. Call the available tools to gather evidence, weigh how well "
                    "their languages match the issue against its complexity, then call "
                    "submit_prediction with your final answer."
                ),
            }]},
            config={"recursion_limit": 10},
        )
    except GraphRecursionError:
        result = {"messages": []}

    for message in reversed(result["messages"]):
        for call in getattr(message, "tool_calls", None) or []:
            if call["name"] == "submit_prediction":
                args = call["args"]
                return {
                    "success_probability": round(max(0.0, min(1.0, float(args["probability"]))), 3),
                    "difficulty": args["difficulty"],
                    "rationale": args.get("rationale", ""),
                }

    # Fallback if the agent didn't converge within the recursion budget
    return {"success_probability": 0.5, "difficulty": "medium", "rationale": "agent did not converge"}
