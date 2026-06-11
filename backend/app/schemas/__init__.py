from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Generic, TypeVar
from datetime import datetime

T = TypeVar("T")

# --- Auth / User Schemas ---


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


# --- Score Schemas ---


class ScoreCreate(BaseModel):
    category: str
    score: int = Field(ge=1, le=5, description="Score from 1 (poor) to 5 (excellent)")
    note: Optional[str] = None


class ScoreResponse(BaseModel):
    id: int
    category: str
    score: int
    note: Optional[str]
    reviewer_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Candidate Schemas ---


class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    role_applied: str
    skills: List[str] = []


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(CandidateBase):
    id: int
    status: str
    created_at: datetime
    ai_summary: Optional[str] = None
    scores: List[ScoreResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CandidateDetailAdminResponse(CandidateResponse):
    """Admin-only response that includes internal_notes."""
    internal_notes: Optional[str] = None


class CandidateUpdateNotes(BaseModel):
    internal_notes: str


class CandidateUpdateStatus(BaseModel):
    status: str = Field(description="new | reviewed | hired | rejected | archived")


# --- Paginated Response ---


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
