from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Issue Pilot"
    app_env: str = "development"
    debug: bool = False

    database_url: str
    db_pool_size: int = 10

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str | None = None
    qdrant_https: bool = False
    qdrant_collection: str = "issuepilot_knowledge"
    qdrant_issues_collection: str = "issue_embeddings"

    hf_token: str | None = None

    github_client_id: str | None = None
    github_client_secret: str | None = None
    github_redirect_uri: str | None = None
    github_ingest_token: str | None = None

    frontend_url: str = "http://localhost:5173"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    groq_api_key: str
    agent_model: str = "openai/gpt-oss-120b"
    agent_timeout_seconds: float = 30.0

    # A stored success prediction is reused for this long, unless the issue changes first.
    prediction_ttl_hours: int = 72

    scheduler_enabled: bool = True

    # Shared secret for /admin/* and /rag/ingest, sent as the X-Admin-Key header.
    # Left unset, those endpoints reject every request.
    admin_api_key: str | None = None

    # /rag/ingest only reads PDFs from inside this directory.
    rag_documents_dir: str = "data/documents"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()