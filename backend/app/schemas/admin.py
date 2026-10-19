import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class JobStartedResponse(BaseModel):
    job: str
    status: str


def _as_str_list(value):
    # LLM output may arrive as a list, a comma-separated string, or null.
    if value is None:
        return None
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return [str(v) for v in value]


class IngestIssueRequest(BaseModel):
    repository: str
    number: int
    title: str
    description: str | None = None
    url: str | None = None
    state: str | None = None
    labels: list[str] = []
    created_at: datetime | None = None
    difficulty: str | None = None
    required_skills: list[str] | None = None
    category: str | None = None
    potential_blockers: list[str] | None = None
    github_issue_id: int | None = None

    @field_validator("labels", mode="before")
    @classmethod
    def _labels(cls, value):
        # Accept either ["bug"] or GitHub's [{"name": "bug", ...}].
        if value is None:
            return []
        if isinstance(value, str):
            return _as_str_list(value)
        return [v["name"] if isinstance(v, dict) else str(v) for v in value]

    @field_validator("required_skills", "potential_blockers", mode="before")
    @classmethod
    def _str_lists(cls, value):
        return _as_str_list(value)


class IngestIssueResponse(BaseModel):
    id: uuid.UUID
    created: bool
