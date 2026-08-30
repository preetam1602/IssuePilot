# IssuePilot

AI-powered issue recommendations and contribution-success predictions for open-source contributors. Sign in with GitHub, get issues matched to your real skills (derived from your public repos), and ask the agent whether you're likely to successfully resolve a given issue.

## Stack

- **Frontend**: React 19 + Vite, React Query, React Router
- **Backend**: FastAPI, SQLAlchemy + Alembic, PostgreSQL
- **RAG**: Qdrant (vector search), `BAAI/bge-small-en-v1.5` embeddings (`sentence-transformers`)
- **Agent**: Groq (`openai/gpt-oss-120b`) orchestrated via LangGraph, tool-calling
- **Auth**: GitHub OAuth + JWT

## Project structure

```
backend/
  app/
    api/            # FastAPI routers (auth, issues, recommend, predict, profile, rag, admin, health)
    services/        # GitHub ingestion, feature engineering, retrieval, agent, scoring, auth
    rag/             # Embedding model, Qdrant clients, document-RAG pipeline
    models.py         # SQLAlchemy models
    config.py         # Settings (reads backend/.env)
    scheduler.py      # APScheduler jobs (nightly scoring, weekly reindex)
  alembic/            # DB migrations
frontend/
  src/
    pages/            # Landing, Dashboard, IssueExplorer, IssueDetail, Profile
    components/       # Navbar, Sidebar, IssueCard, PredictionBadge
    hooks/             # React Query hooks (useIssues, useRecommendations, usePrediction, useProfile)
    lib/               # api client, auth token handling, formatting helpers
```

## Prerequisites

- Python 3.11+
- Node 18+
- PostgreSQL 16 (running locally, no extensions needed)
- Qdrant (`docker run -d --name issuepilot-qdrant -p 6333:6333 -p 6334:6334 -v issuepilot_qdrant_data:/qdrant/storage qdrant/qdrant`)
- A [GitHub OAuth App](https://github.com/settings/developers) (for sign-in) and a GitHub personal access token (for repo/issue ingestion)
- A [Groq API key](https://console.groq.com/)

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt

cp .env.example .env          # fill in DATABASE_URL, GitHub OAuth/token, GROQ_API_KEY, JWT_SECRET
alembic upgrade head

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env           # defaults to http://localhost:8000, adjust if needed
npm run dev
```

Open `http://localhost:5173`.

## Populating data

The app needs real GitHub issues before recommendations/search are useful. Repos are discovered dynamically (not hardcoded) across three difficulty tiers by star count, biased toward repos actively tagging "good first issue" work. Trigger it via the interactive API docs at `http://localhost:8000/docs`, in order:

1. `POST /admin/ingest-issues` — discovers repos, ingests their open issues
2. `POST /admin/build-features` — computes complexity/popularity scores and embeds each issue into Qdrant
3. `POST /admin/ingest-events` — ingests recent merged-PR history (grounds the prediction agent)

## API overview

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/auth/github` | — | Redirects to GitHub OAuth |
| GET | `/auth/callback` | — | Exchanges code, upserts user, derives skills from public repos, issues JWT |
| GET | `/issues` | — | Search/filter (`search`, `difficulty`, `sort`), paginated |
| GET | `/issues/{id}` | — | Single issue detail |
| GET | `/recommend` | required | Personalized recommendations (cached, computed on demand on cache miss) |
| POST | `/predict` | required | Runs the LangGraph/Groq agent, caches the result |
| GET | `/profile` | required | Current user's profile, derived stats, skills |
| POST | `/admin/*` | — | Ingestion/scoring triggers (see above) |
| GET | `/health/db`, `/health/qdrant` | — | Connectivity checks |

Full interactive docs at `/docs` once the backend is running.

## Notes

- The GitHub OAuth callback derives your skill profile automatically from your public repos' languages — no manual setup needed once you sign in.
- A background scheduler (APScheduler) runs nightly scoring and a weekly repo/event refresh; toggle with `SCHEDULER_ENABLED` in `backend/.env`.
