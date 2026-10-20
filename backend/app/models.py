import uuid

from sqlalchemy import (
    ARRAY,
    Boolean,
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    github_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String)
    avatar_url: Mapped[str | None] = mapped_column(String)
    bio: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String)
    website: Mapped[str | None] = mapped_column(String)
    twitter_username: Mapped[str | None] = mapped_column(String)
    total_stars: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str | None] = mapped_column(String)
    level: Mapped[int] = mapped_column(SmallInteger, default=1)
    repo_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = (
        # Trigram indexes let the explorer's ILIKE '%term%' search use an index.
        Index("ix_issues_title_trgm", "title", postgresql_using="gin", postgresql_ops={"title": "gin_trgm_ops"}),
        Index(
            "ix_issues_repo_full_name_trgm",
            "repo_full_name",
            postgresql_using="gin",
            postgresql_ops={"repo_full_name": "gin_trgm_ops"},
        ),
        Index("ix_issues_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    github_issue_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    issue_number: Mapped[int | None] = mapped_column(Integer)
    repo_full_name: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    labels: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    state: Mapped[str | None] = mapped_column(String)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    repo_stars: Mapped[int] = mapped_column(Integer, default=0)
    repo_forks: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str | None] = mapped_column(String)
    difficulty: Mapped[str | None] = mapped_column(String)
    url: Mapped[str | None] = mapped_column(String)
    llm_difficulty: Mapped[str | None] = mapped_column(String)
    llm_required_skills: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    llm_category: Mapped[str | None] = mapped_column(String)
    llm_potential_blockers: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    created_at: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    fetched_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


# Repo + number lookups compare lowercased repo names.
Index("ix_issues_lower_repo_issue_number", func.lower(Issue.repo_full_name), Issue.issue_number)


class ContributionEvent(Base):
    __tablename__ = "contribution_events"
    __table_args__ = (
        # PR numbers are only unique within a repo, so the repo is part of the key.
        UniqueConstraint("github_user_id", "repo_full_name", "pr_number", name="uq_contribution_events_user_repo_pr"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    github_user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    repo_full_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    issue_number: Mapped[int | None] = mapped_column(Integer)
    pr_number: Mapped[int] = mapped_column(Integer, nullable=False)
    pr_merged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_total_prs: Mapped[int] = mapped_column(Integer, default=0)
    user_avg_pr_size: Mapped[float | None] = mapped_column(Float)
    user_languages: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    issue_complexity_score: Mapped[float | None] = mapped_column(Float)
    issue_comments_count: Mapped[int | None] = mapped_column(Integer)
    issue_days_open: Mapped[float | None] = mapped_column(Float)
    issue_labels: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False)
    event_at: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    fetched_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Feature(Base):
    __tablename__ = "features"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), unique=True
    )
    label_onehot: Mapped[list[float] | None] = mapped_column(ARRAY(Float))
    complexity_score: Mapped[float | None] = mapped_column(Float)
    popularity_score: Mapped[float | None] = mapped_column(Float)
    time_to_close_days: Mapped[float | None] = mapped_column(Float)
    computed_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"
    __table_args__ = (
        UniqueConstraint("user_id", "issue_id", name="uq_predictions_user_issue"),
        Index("ix_predictions_user_relevance", "user_id", text("relevance_score DESC NULLS LAST")),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    issue_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"))
    relevance_score: Mapped[float | None] = mapped_column(Float)
    success_prob: Mapped[float | None] = mapped_column(Float)
    difficulty_tag: Mapped[str | None] = mapped_column(String)
    predicted_at: Mapped[object | None] = mapped_column(DateTime(timezone=True))
    scored_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())
    score_version: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SavedIssue(Base):
    __tablename__ = "saved_issues"
    __table_args__ = (UniqueConstraint("user_id", "issue_id", name="uq_saved_issues_user_issue"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    issue_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"))
    # Snapshot of the thread size when saved, so the Claim Radar can tell how much it grew since.
    comments_at_save: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    saved_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    boosted_languages: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, server_default="{}")
    muted_languages: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, server_default="{}")
    comfort_difficulty: Mapped[str] = mapped_column(String, default="any", server_default="any")
    prefer_fresh: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
