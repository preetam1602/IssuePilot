from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Issue Pilot"
    app_env: str = "development"
    debug: bool = True

    database_url: str
    db_pool_size: int = 10

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
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

    scheduler_enabled: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()