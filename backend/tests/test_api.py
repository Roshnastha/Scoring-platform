"""
test_api.py
-----------
Integration tests using an in-memory SQLite database.
Covers:
  1. Candidate creation and verification (API endpoint test)
  2. Auth enforcement — reviewer cannot see another reviewer's scores
  3. Soft-delete — deleted candidates are hidden from list and detail
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import get_db
from app.models import Base, User, Candidate, Score
from app.core.security import get_password_hash

# ---------------------------------------------------------------------------
# Test DB setup — isolated in-memory SQLite
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    # Create test users
    rev1 = User(email="reviewer1@test.com", hashed_password=get_password_hash("pass"), role="reviewer")
    rev2 = User(email="reviewer2@test.com", hashed_password=get_password_hash("pass"), role="reviewer")
    admin = User(email="admin@test.com", hashed_password=get_password_hash("pass"), role="admin")
    db.add_all([rev1, rev2, admin])
    db.commit()
    db.refresh(rev1)

    # Create a candidate
    candidate = Candidate(
        name="John Doe",
        email="john@test.com",
        role_applied="Developer",
        skills=["Python", "React"],
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # Add a score by reviewer1 only
    score = Score(
        candidate_id=candidate.id,
        category="Technical",
        score=4,
        reviewer_id=rev1.id,
        note="Good",
    )
    db.add(score)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_token(email: str, password: str = "pass") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    return response.json()["access_token"]


def admin_headers() -> dict:
    return {"Authorization": f"Bearer {get_token('admin@test.com')}"}


def reviewer1_headers() -> dict:
    return {"Authorization": f"Bearer {get_token('reviewer1@test.com')}"}


def reviewer2_headers() -> dict:
    return {"Authorization": f"Bearer {get_token('reviewer2@test.com')}"}


# ---------------------------------------------------------------------------
# Test 1 — Create candidate and verify it appears in list (admin creates)
# ---------------------------------------------------------------------------

def test_create_candidate_and_verify(setup_db):
    """Admin creates a candidate; it shows up in the paginated list."""
    candidate_data = {
        "name": "Jane Smith",
        "email": "jane@test.com",
        "role_applied": "UX Designer",
        "skills": ["Figma", "Sketch"],
    }
    response = client.post("/api/v1/candidates/", json=candidate_data, headers=admin_headers())
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Jane Smith"
    assert body["status"] == "new"

    # Verify via list endpoint
    list_resp = client.get("/api/v1/candidates/", headers=admin_headers())
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert "items" in data
    assert "total" in data
    emails = [c["email"] for c in data["items"]]
    assert "jane@test.com" in emails


# ---------------------------------------------------------------------------
# Test 2 — Auth enforcement: reviewer cannot see another reviewer's scores
# ---------------------------------------------------------------------------

def test_auth_enforcement_reviewer_visibility(setup_db):
    """
    Reviewer 1 sees their own score on John Doe.
    Reviewer 2 sees zero scores on the same candidate.
    Admin sees all scores.
    """
    # Reviewer 1 should see their score on candidate id=1
    res1 = client.get("/api/v1/candidates/1", headers=reviewer1_headers())
    assert res1.status_code == 200
    scores1 = res1.json()["scores"]
    assert len(scores1) == 1
    assert scores1[0]["reviewer_id"] == 1

    # Reviewer 2 should see NO scores (they haven't submitted any)
    res2 = client.get("/api/v1/candidates/1", headers=reviewer2_headers())
    assert res2.status_code == 200
    assert len(res2.json()["scores"]) == 0

    # Admin should see all scores
    res_admin = client.get("/api/v1/candidates/1", headers=admin_headers())
    assert res_admin.status_code == 200
    assert len(res_admin.json()["scores"]) == 1


# ---------------------------------------------------------------------------
# Test 3 — Soft delete: archived candidates disappear from list and detail
# ---------------------------------------------------------------------------

def test_soft_delete_candidate(setup_db):
    """
    Admin soft-deletes a candidate.
    The candidate must NOT appear in list results.
    GET /{id} must return 404 for the deleted candidate.
    """
    # First create a candidate to delete
    create_resp = client.post(
        "/api/v1/candidates/",
        json={
            "name": "Delete Me",
            "email": "deleteme@test.com",
            "role_applied": "QA Engineer",
            "skills": ["Selenium"],
        },
        headers=admin_headers(),
    )
    assert create_resp.status_code == 201
    candidate_id = create_resp.json()["id"]

    # Confirm it appears in the list
    list_before = client.get("/api/v1/candidates/", headers=admin_headers())
    ids_before = [c["id"] for c in list_before.json()["items"]]
    assert candidate_id in ids_before

    # Soft-delete it
    del_resp = client.delete(f"/api/v1/candidates/{candidate_id}", headers=admin_headers())
    assert del_resp.status_code == 204

    # Must NOT appear in list anymore
    list_after = client.get("/api/v1/candidates/", headers=admin_headers())
    ids_after = [c["id"] for c in list_after.json()["items"]]
    assert candidate_id not in ids_after

    # GET detail must return 404
    detail_resp = client.get(f"/api/v1/candidates/{candidate_id}", headers=admin_headers())
    assert detail_resp.status_code == 404


# ---------------------------------------------------------------------------
# Test 4 — Registration always assigns reviewer role (no role spoofing)
# ---------------------------------------------------------------------------

def test_registration_hardcodes_reviewer_role(setup_db):
    """Registration must never accept role from client — always assigns 'reviewer'."""
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@test.com", "password": "securepass"},
    )
    assert reg_resp.status_code == 200
    assert reg_resp.json()["role"] == "reviewer"
