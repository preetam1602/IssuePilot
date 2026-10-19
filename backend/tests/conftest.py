import os

# Set before the app is imported: env vars take precedence over backend/.env.
os.environ["SCHEDULER_ENABLED"] = "false"
os.environ["ADMIN_API_KEY"] = "test-admin-key"
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from app.main import app

    return TestClient(app)


@pytest.fixture
def admin_headers():
    return {"X-Admin-Key": "test-admin-key"}
