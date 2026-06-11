from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import asyncio

from app import models, schemas
from app.core import security as auth
from app.db.database import get_db
from app.services import candidate_service

router = APIRouter()

@router.post(
    "/",
    response_model=schemas.CandidateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new candidate (admin only)",
)
def create_candidate(
    candidate_in: schemas.CandidateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    return candidate_service.create_candidate(candidate_in, db)


@router.get(
    "/",
    response_model=schemas.PaginatedResponse[schemas.CandidateResponse],
    summary="List candidates with filters and pagination",
)
def get_candidates(
    status: Optional[str] = Query(None, description="Filter by status: new|reviewed|hired|rejected"),
    role_applied: Optional[str] = Query(None, description="Filter by role"),
    skill: Optional[str] = Query(None, description="Filter by a specific skill"),
    keyword: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    result = candidate_service.list_candidates(
        db=db,
        status=status,
        role_applied=role_applied,
        skill=skill,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )
    return result


@router.get(
    "/{candidate_id}",
    summary="Get candidate detail (RBAC: reviewer sees own scores only)",
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    if current_user.role == "admin":
        return schemas.CandidateDetailAdminResponse.model_validate(candidate)

    # Reviewer: filter scores to only their own
    response_data = schemas.CandidateResponse.model_validate(candidate)
    response_data.scores = [
        s for s in response_data.scores if s.reviewer_id == current_user.id
    ]
    return response_data


@router.delete(
    "/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a candidate (admin only) — sets status to 'archived'",
)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    candidate_service.soft_delete_candidate(candidate, db)


@router.patch(
    "/{candidate_id}/notes",
    response_model=schemas.CandidateDetailAdminResponse,
    summary="Update internal notes (admin only)",
)
def update_notes(
    candidate_id: int,
    notes_in: schemas.CandidateUpdateNotes,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    updated = candidate_service.update_internal_notes(candidate, notes_in.internal_notes, db)
    return schemas.CandidateDetailAdminResponse.model_validate(updated)


@router.patch(
    "/{candidate_id}/status",
    response_model=schemas.CandidateDetailAdminResponse,
    summary="Update candidate status (admin only)",
)
def update_status(
    candidate_id: int,
    status_in: schemas.CandidateUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    updated = candidate_service.update_status(candidate, status_in.status, db)
    return schemas.CandidateDetailAdminResponse.model_validate(updated)

@router.post(
    "/{candidate_id}/scores",
    response_model=schemas.ScoreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a score for a candidate",
)
def submit_score(
    candidate_id: int,
    score_in: schemas.ScoreCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return candidate_service.submit_score(candidate, score_in, current_user.id, db)

@router.post(
    "/{candidate_id}/summary",
    summary="Trigger mock AI summary generation",
)
async def generate_ai_summary(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    try:
        candidate = candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    summary = await candidate_service.generate_summary(candidate, db)
    return {"message": "Summary generated successfully", "summary": summary}

@router.get(
    "/{candidate_id}/stream",
    summary="SSE endpoint — streams score updates in real time",
)
async def stream_scores(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_sse),
):
    """
    Server-Sent Events endpoint that emits the current scores for a candidate
    every 3 seconds, allowing the frontend to receive live updates without polling.
    Connects are kept alive for up to ~30 seconds (10 ticks).
    """
    try:
        candidate_service.get_candidate_or_404(candidate_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    async def event_generator():
        for _ in range(10):
            # Expire all objects in the session so fresh data is loaded from the DB
            db.expire_all()
            candidate = (
                db.query(models.Candidate)
                .filter(models.Candidate.id == candidate_id)
                .first()
            )
            if not candidate:
                break

            if current_user.role == "admin":
                scores = [
                    schemas.ScoreResponse.model_validate(s).model_dump(mode="json")
                    for s in candidate.scores
                ]
            else:
                scores = [
                    schemas.ScoreResponse.model_validate(s).model_dump(mode="json")
                    for s in candidate.scores
                    if s.reviewer_id == current_user.id
                ]

            payload = json.dumps({"candidate_id": candidate_id, "scores": scores})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(3)

        yield "data: {\"event\": \"done\"}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
