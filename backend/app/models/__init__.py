from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="reviewer",
                  nullable=False)  # "reviewer" or "admin"


class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role_applied = Column(String, index=True, nullable=False)
    status = Column(String, default="new", index=True, nullable=False)
    skills = Column(JSON, default=list)  # Array of skills
    internal_notes = Column(Text, nullable=True)  # Admin only
    ai_summary = Column(Text, nullable=True)  # Stores mock AI summary
    created_at = Column(DateTime, default=utcnow)

    scores = relationship("Score", back_populates="candidate")


class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey(
        "candidates.id"), index=True, nullable=False)
    category = Column(String, nullable=False)
    score = Column(Integer, nullable=False)  # 1-5
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    candidate = relationship("Candidate", back_populates="scores")
