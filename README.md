# Candidate Scoring Platform

A full-stack web application for evaluating and scoring job candidates with real-time AI-powered insights, internal notes, and candidate management capabilities.

**Features:**
- 🎯 Multi-criteria candidate scoring
- 🤖 AI-generated candidate summaries  
- 📝 Internal notes and reviewer feedback
- 👥 Role-based access (Admin & Reviewer)
- 🔐 Secure authentication

---

## Table of Contents

- [Technologies Used](#technologies-used)
- [Quick Start](#quick-start)
- [Running with Docker Compose](#running-with-docker-compose)
- [Running Locally (Dev Mode)](#running-locally-dev-mode)
- [Default Credentials](#default-credentials)
- [API Reference & curl Examples](#api-reference--curl-examples)
- [Debugging Signal — Bug Identification](#debugging-signal--bug-identification)
- [Architecture Decision Record (ADR)](#architecture-decision-record-adr)
- [Learning Reflection](#learning-reflection)
- [Project Structure](#project-structure)

---

## Technologies Used

### Backend
- **Python 3.11** 
- **FastAPI** (Web framework, automatic OpenAPI docs)
- **SQLAlchemy** (ORM)
- **SQLite** (Database, easily swappable to PostgreSQL)
- **SlowAPI** (Rate limiting)
- **Pytest** (Testing)

### Frontend
- **React 18** (UI Library)
- **Vite** (Build tool and dev server)
- **TypeScript** (Static typing)
- **Tailwind CSS** (Styling)
- **Axios** (API client)
- **React Router** (Navigation)
- **Lucide React** (Icons)

### Infrastructure
- **Docker & Docker Compose** (Containerization and orchestration)
- **Nginx** (Serving production frontend build)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Roshnastha/Scoring-platform.git
cd Scoring-platform

# 2. Copy environment template
cp .env.example backend/.env
# Edit backend/.env and set a strong SECRET_KEY

# 3. Run everything with Docker Compose
docker compose up --build
```

- **Backend API:** http://localhost:8000
- **Frontend:** http://localhost:5173
- **API Docs (Swagger):** http://localhost:8000/api/v1/openapi.json

---

## Running with Docker Compose

```bash
# Start both services
docker compose up --build

# Stop
docker compose down

# View backend logs
docker compose logs -f backend
```

> **Ports:** Backend on `8000`, Frontend on `5173` (nginx serving the built React app).

---

## Running Locally (Dev Mode)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env    # then edit .env

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Vite dev server starts on http://localhost:5173
```

### Running Tests

```bash
cd backend
# Activate venv first
pytest tests/ -v
```

---

## Default Credentials & Database Seeding

An admin user is **auto-created** when the FastAPI application starts:

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `admin123` | admin |

> Register additional users via `POST /api/v1/auth/register` — all registrations default to the `reviewer` role. Role cannot be set from the client.

### Optional: Seed Mock Data

If you want to populate the database with dummy candidates and extra reviewers for testing, you can run the seed script:

```bash
cd backend
# With virtual environment activated:
python seed/seed.py
```

This will create:
- Two reviewer accounts (`reviewer1@example.com`, `reviewer2@example.com` — password: `reviewer123`)
- A batch of mock candidates with sample score data.

---

## API Reference & curl Examples

All endpoints are prefixed with `/api/v1`.

### Auth

```bash
# Register a reviewer
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "reviewer@example.com", "password": "mypassword"}'

# Login (returns JWT)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=admin@techkraft.com&password=admin123"
```

### Candidates

```bash
# List candidates with filters + pagination
curl -X GET "http://localhost:8000/api/v1/candidates/?status=new&page=1&page_size=10" \
  -H "Authorization: Bearer <TOKEN>"

# Get candidate detail
curl -X GET http://localhost:8000/api/v1/candidates/1 \
  -H "Authorization: Bearer <TOKEN>"

# Create a candidate (admin only)
curl -X POST http://localhost:8000/api/v1/candidates/ \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Dev","email":"alice@example.com","role_applied":"Backend Engineer","skills":["Python","FastAPI","PostgreSQL"]}'

# Soft-delete a candidate (admin only) — sets status to "archived"
curl -X DELETE http://localhost:8000/api/v1/candidates/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Update internal notes (admin only)
curl -X PATCH http://localhost:8000/api/v1/candidates/1/notes \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"internal_notes": "Strong candidate, schedule final round."}'
```

### Scoring

```bash
# Submit a score (any authenticated user)
curl -X POST http://localhost:8000/api/v1/candidates/1/scores \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"category": "Technical", "score": 4, "note": "Solid problem solving"}'
```

### AI Summary

```bash
# Trigger mock AI summary (simulates 2s async LLM call)
curl -X POST http://localhost:8000/api/v1/candidates/1/summary \
  -H "Authorization: Bearer <TOKEN>"
```

### SSE Streaming (Stretch Goal)

```bash
# Stream live score updates (Server-Sent Events)
curl -N http://localhost:8000/api/v1/candidates/1/stream \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: text/event-stream"
```

---

## Debugging Signal — Bug Identification

### Bug 1: Python Memory Filtering (Hypothetical Scalability Issue)

The following query pattern has a **critical scalability bug**:

```python
# ❌ BUGGY — fetch-all-then-filter-in-Python
def search_candidates(status, keyword, page, page_size):
    all_candidates = db.execute("SELECT * FROM candidates").fetchall()
    filtered = [c for c in all_candidates if c["status"] == status]
    # ... also filter by keyword in Python ...
    offset = (page - 1) * page_size
    return filtered[offset : offset + page_size]
```

### What's Wrong

1. **Full table scan into memory.** `SELECT * FROM candidates` loads every row regardless of filters. With 100k candidates, this transfers all rows from the DB to the application server on every request.

2. **Pagination is applied to the wrong dataset.** The slice `filtered[offset:offset+page_size]` runs on an already-Python-filtered list, so `total` counts and page numbers are computed against the full table, not the filtered subset. This means page 2 may skip valid results or return duplicates.

3. **No index utilisation.** Because filtering happens in Python after a full scan, the database indexes on `status` and `role_applied` are completely bypassed.

### Correct Approach

Push all filtering **into the database query** with `WHERE` clauses, use `COUNT()` for the total, and apply `LIMIT`/`OFFSET` at the DB level:

```python
# CORRECT — filter in SQL, paginate with LIMIT/OFFSET
def search_candidates(status, keyword, page, page_size):
    query = db.query(Candidate).filter(Candidate.status != "archived")
    if status:
        query = query.filter(Candidate.status == status)      # uses index
    if keyword:
        query = query.filter(Candidate.name.ilike(f"%{keyword}%"))
    total = query.count()                                      # DB count
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()       # DB pagination
    return {"items": items, "total": total, ...}
```

This approach is O(result_set) instead of O(full_table), uses indexes, and gives accurate pagination metadata.

---

## Architecture Decision Record (ADR)

### ADR-1: FastAPI over Flask/Django

**Context:** Needed a Python web framework for an async, JWT-secured REST API with auto-generated docs.

**Decision:** Chose **FastAPI**.

**Rationale:** FastAPI's `async`/`await` support maps cleanly to simulated LLM calls and SSE streaming. Pydantic v2 models provide request validation, serialisation, and schema generation with zero boilerplate. The automatic Swagger/OpenAPI UI (`/docs`) is invaluable for evaluators testing the API without a client.

**Trade-off:** FastAPI is younger than Django REST Framework. Some batteries (admin panel, ORM migrations via Alembic) require additional setup. For this scope, that's acceptable.

---

### ADR-2: SQLite for development, schema designed for PostgreSQL parity

**Context:** The spec said "DynamoDB-style or SQLite". The task is an internal tool, not a distributed system.

**Decision:** Used **SQLite** via SQLAlchemy ORM, with `DATABASE_URL` in `.env` so swapping to PostgreSQL requires only a connection string change.

**Rationale:** SQLite requires zero infrastructure setup, making local dev and Docker-single-container testing trivial. The SQLAlchemy abstraction means the same models, queries, and indexes work on PostgreSQL. Appropriate indexes are declared on `candidates.status`, `candidates.role_applied`, and `scores.candidate_id`.

**Trade-off:** SQLite doesn't support concurrent writes well (single writer lock). Production deployments must switch to PostgreSQL/MySQL. This is documented and the config layer makes migration easy.

---

### ADR-3: Stateless JWT auth, role hardcoded at registration

**Context:** Need RBAC with `reviewer` and `admin` roles. Must prevent clients from self-assigning admin.

**Decision:** **JWT-based auth** with role embedded in the token payload. Registration endpoint hardcodes `role="reviewer"` and ignores any role field from the client. Admin is seeded at startup.

**Rationale:** Stateless JWTs eliminate the need for a session store, making the API horizontally scalable. Hardcoding role at registration (rather than accepting it from JSON) is a simple, auditable security control — no middleware or complex validation needed.

**Trade-off:** JWTs cannot be revoked before expiry without a token blacklist (not implemented here). For a short-lived internal tool, the 60-minute expiry window is an acceptable risk. A production system would add a Redis-backed revocation list or use short-lived tokens with refresh.

---

## Learning Reflection

Implementing **Server-Sent Events (SSE)** with FastAPI's `StreamingResponse` and `async` generators was new territory — it made the real-time score streaming feel lightweight compared to WebSockets, since SSE is unidirectional and works over plain HTTP without upgrade handshakes.

Given more time, I would replace the mock AI summary with a real async call to an LLM provider like the OpenAI API.

---

## Project Structure

```
├── README.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── .env                     # Not committed — copy from .env.example
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan, admin seed
│   │   ├── models.py            # SQLAlchemy ORM models (User, Candidate, Score)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── auth.py              # JWT helpers, get_current_user, require_admin
│   │   ├── core/
│   │   │   └── config.py        # Settings loaded from .env
│   │   ├── db/
│   │   │   └── database.py      # Engine, SessionLocal, get_db dependency
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /register, POST /login
│   │   │   └── candidates.py    # All /candidates endpoints
│   │   └── services/
│   │       └── candidate_service.py  # Business logic layer
│   └── tests/
│       └── test_api.py          # 4 integration tests
└── frontend/
    ├── Dockerfile               # Multi-stage: Vite build → nginx serve
    ├── src/
    │   ├── App.tsx
    │   ├── pages/               # Login, CandidateList, CandidateDetail
    │   ├── components/          # FilterBar, ScoreForm, AISummary, etc.
    │   └── api/                 # Axios API client
    ├── package.json
    └── vite.config.ts
```

---

## Security Notes

- `.env` is in `.gitignore` — credentials are never committed
- `SECRET_KEY` must be changed from the default before any production deployment
- Role cannot be injected via registration payload — server always assigns `reviewer`
- Soft-delete only — candidates are never hard-deleted from the database
- CORS is currently set to `*`; restrict to your frontend domain in production
