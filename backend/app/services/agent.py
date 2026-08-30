from datetime import datetime, timezone
from typing import Literal

from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.errors import GraphRecursionError
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ContributionEvent, Feature, Issue, User

model = ChatGroq(model=settings.agent_model, api_key=settings.groq_api_key)


def _get_user_contribution_history(db: Session, user_id: str) -> dict:
    user = db.get(User, user_id)
    if not user:
        return {}

    events = db.execute(
        select(ContributionEvent).where(ContributionEvent.github_user_id == user.github_id)
    ).scalars().all()

    return {
        "total_merged_prs": sum(1 for e in events if e.pr_merged),
        "repos_contributed_to": sorted({e.repo_full_name for e in events}),
    }


def _get_issue_complexity(db: Session, issue_id: str) -> dict:
    issue = db.get(Issue, issue_id)
    if not issue:
        return {}

    feature = db.execute(select(Feature).where(Feature.issue_id == issue_id)).scalar_one_or_none()

    days_open = None
    if issue.created_at:
        end = issue.closed_at or datetime.now(timezone.utc)
        days_open = (end - issue.created_at).days

    return {
        "complexity_score": feature.complexity_score if feature else None,
        "popularity_score": feature.popularity_score if feature else None,
        "comments_count": issue.comments_count,
        "days_open": days_open,
        "labels": issue.labels,
    }


def predict_contribution(db: Session, user_id: str, issue_id: str) -> dict:
    @tool
    def get_user_contribution_history(user_id: str) -> dict:
        """Fetch a contributor's merged-PR history and the repos they've contributed to."""
        return _get_user_contribution_history(db, user_id)

    @tool
    def get_issue_complexity(issue_id: str) -> dict:
        """Fetch complexity and activity signals for an issue."""
        return _get_issue_complexity(db, issue_id)

    @tool
    def submit_prediction(probability: float, difficulty: Literal["easy", "medium", "hard"], rationale: str = "") -> str:
        """Submit the final probability and difficulty tag for this user/issue pair."""
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
                    f"Assess whether user {user_id} is likely to successfully resolve "
                    f"issue {issue_id}. Call the available tools to gather evidence, then "
                    f"call submit_prediction with your final answer."
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
                    "success_probability": round(args["probability"], 3),
                    "difficulty": args["difficulty"],
                    "rationale": args.get("rationale", ""),
                }

    # Fallback if the agent didn't converge within the recursion budget
    return {"success_probability": 0.5, "difficulty": "medium", "rationale": "agent did not converge"}
