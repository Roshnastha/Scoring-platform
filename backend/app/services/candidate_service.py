import asyncio
from typing import Optional
from sqlalchemy import String
from sqlalchemy.orm import Session

from app import models, schemas


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_candidate_or_404(candidate_id: int, db: Session) -> models.Candidate:
    """Return a non-archived candidate or raise ValueError."""
    candidate = (
        db.query(models.Candidate)
        .filter(models.Candidate.id == candidate_id)
        .first()
    )
    if not candidate or candidate.status == "archived":
        raise ValueError("Candidate not found")
    return candidate


def list_candidates(
    db: Session,
    status: Optional[str] = None,
    role_applied: Optional[str] = None,
    skill: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(models.Candidate).filter(
        models.Candidate.status != "archived"
    )

    if status:
        query = query.filter(models.Candidate.status == status)

    if role_applied:
        query = query.filter(models.Candidate.role_applied == role_applied)

    if keyword:
        query = query.filter(
            models.Candidate.name.ilike(f"%{keyword}%")
            | models.Candidate.email.ilike(f"%{keyword}%")
        )

    if skill:
        # JSON column stored as serialised string — LIKE is safe here
        query = query.filter(
            models.Candidate.skills.cast(String).ilike(f"%{skill}%")
        )

    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, -(-total // page_size)),  # ceiling division
    }


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def create_candidate(candidate_in: schemas.CandidateCreate, db: Session) -> models.Candidate:
    db_obj = models.Candidate(**candidate_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def submit_score(
    candidate: models.Candidate,
    score_in: schemas.ScoreCreate,
    reviewer_id: int,
    db: Session,
) -> models.Score:
    new_score = models.Score(
        **score_in.model_dump(),
        candidate_id=candidate.id,
        reviewer_id=reviewer_id,
    )
    db.add(new_score)

    # Auto-transition from "new" → "reviewed" on first score
    if candidate.status == "new":
        candidate.status = "reviewed"

    db.commit()
    db.refresh(new_score)
    return new_score


def update_internal_notes(
    candidate: models.Candidate, notes: str, db: Session
) -> models.Candidate:
    candidate.internal_notes = notes
    db.commit()
    db.refresh(candidate)
    return candidate


def update_status(
    candidate: models.Candidate, new_status: str, db: Session
) -> models.Candidate:
    candidate.status = new_status
    db.commit()
    db.refresh(candidate)
    return candidate


def soft_delete_candidate(candidate: models.Candidate, db: Session) -> None:
    """Soft-delete: set status to 'archived'. Never hard-deletes."""
    candidate.status = "archived"
    db.commit()


async def generate_summary(candidate: models.Candidate, db: Session) -> str:
    """
    Simulates an async LLM call with a 2-second delay.
    In production this would call an LLM API asynchronously.
    """
    await asyncio.sleep(2)
    summary = (
        f"Candidate {candidate.name} is applying for {candidate.role_applied}. "
        f"Key skills include: {', '.join(candidate.skills or [])}. "
        f"Based on the profile, this candidate demonstrates strong technical aptitude "
        f"and relevant domain experience."
    )
    candidate.ai_summary = summary
    db.commit()
    db.refresh(candidate)
    return summary
