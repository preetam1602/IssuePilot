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
    api/            # FastAPI routers (auth, issues, recommend, predict, profile, saved, history, trending, settings, rag, admin, health)
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

The app needs real GitHub issues before recommendations/search are useful. Repos are discovered dynamically (not hardcoded) across three difficulty tiers by star count, biased toward repos actively tagging "good first issue" work.

Admin endpoints require the `X-Admin-Key` header to match `ADMIN_API_KEY` in `backend/.env` (they reject everything while it's unset). In the interactive docs at `http://localhost:8000/docs`, click **Authorize** and paste the key. Each job runs in the background and returns `202` immediately, so watch the server log for its result. Only one job runs at a time (a second call gets `409`). Run them in order, waiting for each to finish:

1. `POST /admin/ingest-issues`: discovers repos, ingests their open issues, marks issues that are no longer open as closed
2. `POST /admin/build-features`: embeds new or changed issues into Qdrant and refreshes complexity/popularity scores
3. `POST /admin/ingest-events`: ingests recent merged-PR history (grounds the prediction agent)

`POST /rag/ingest` also needs the admin key, and its `file_path` is relative to `RAG_DOCUMENTS_DIR` (default `backend/data/documents`).

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
| GET/POST/DELETE | `/saved` | required | Saved issues with Claim Radar status (open, quiet, contested, closed) |
| GET | `/history` | required | Growth Path: checked issues + merged PRs by difficulty, current level, next step |
| GET | `/trending?days=7` | — | Newcomer Heat: repos ranked by new issues, merges and first-time contributors |
| GET/PUT | `/settings/matcher` | required | Matcher preferences (boost/mute languages, comfort difficulty, freshness) |
| POST | `/settings/matcher/preview` | required | Top 5 recommendations under unsaved preferences |
| POST | `/admin/*` | admin key | Ingestion/scoring triggers (see above) |
| POST | `/rag/search` | required | Search ingested documents |
| POST | `/rag/ingest` | admin key | Ingest a PDF from `RAG_DOCUMENTS_DIR` |
| GET | `/health/db`, `/health/qdrant` | — | Connectivity checks |

Full interactive docs at `/docs` once the backend is running.

## Notes

- The GitHub OAuth callback derives your skill profile automatically from your public repos' languages — no manual setup needed once you sign in.
- A background scheduler (APScheduler) runs nightly scoring and a weekly refresh (issues, events, embeddings, scores); toggle with `SCHEDULER_ENABLED` in `backend/.env`. Jobs take a Postgres advisory lock, so running several uvicorn workers is safe: only one worker runs each job.
- Issues pushed through `POST /admin/ingest-issue` are embedded right away, so they show up in recommendations without waiting for the next `build-features` run.
- Success predictions are cached per user/issue for `PREDICTION_TTL_HOURS` (default 72), or until the issue changes.
- If your Qdrant server was started with an API key, set `QDRANT_API_KEY` in `backend/.env`.

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```
