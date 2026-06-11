import os
import sys

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal
from app import models
from app.core.security import get_password_hash

def seed_db():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.User).count() > 0:
            print("Database already contains users. Skipping seed to prevent duplicates.")
            return

        print("Seeding users...")
        admin = models.User(
            email="admin@techkraft.com",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        reviewer1 = models.User(
            email="reviewer1@techkraft.com",
            hashed_password=get_password_hash("reviewer123"),
            role="reviewer"
        )
        reviewer2 = models.User(
            email="reviewer2@techkraft.com",
            hashed_password=get_password_hash("reviewer123"),
            role="reviewer"
        )
        db.add_all([admin, reviewer1, reviewer2])
        db.commit()

        print("Seeding candidates...")
        candidates = [
            models.Candidate(
                name="Alice Johnson",
                email="alice@example.com",
                role_applied="Frontend Developer",
                skills=["React", "TypeScript", "CSS"],
                status="new"
            ),
            models.Candidate(
                name="Bob Smith",
                email="bob@example.com",
                role_applied="Backend Engineer",
                skills=["Python", "FastAPI", "SQLAlchemy"],
                status="reviewed"
            ),
            models.Candidate(
                name="Charlie Davis",
                email="charlie@example.com",
                role_applied="DevOps Engineer",
                skills=["Docker", "AWS", "CI/CD"],
                status="hired",
                internal_notes="Great cultural fit, ready to start."
            ),
            models.Candidate(
                name="Diana Prince",
                email="diana@example.com",
                role_applied="UX Designer",
                skills=["Figma", "User Research", "Wireframing"],
                status="rejected"
            ),
            models.Candidate(
                name="Evan Wright",
                email="evan@example.com",
                role_applied="Full Stack Developer",
                skills=["React", "Node.js", "MongoDB", "Python"],
                status="new"
            )
        ]
        db.add_all(candidates)
        db.commit()

        # Get their IDs
        bob = db.query(models.Candidate).filter_by(email="bob@example.com").first()
        charlie = db.query(models.Candidate).filter_by(email="charlie@example.com").first()
        rev1 = db.query(models.User).filter_by(email="reviewer1@techkraft.com").first()
        rev2 = db.query(models.User).filter_by(email="reviewer2@techkraft.com").first()

        print("Seeding scores...")
        scores = [
            models.Score(
                candidate_id=bob.id,
                category="Technical",
                score=4,
                reviewer_id=rev1.id,
                note="Solid Python knowledge."
            ),
            models.Score(
                candidate_id=bob.id,
                category="Communication",
                score=3,
                reviewer_id=rev2.id,
                note="A bit nervous but articulated well."
            ),
            models.Score(
                candidate_id=charlie.id,
                category="Problem Solving",
                score=5,
                reviewer_id=rev1.id,
                note="Excellent infrastructure design."
            )
        ]
        db.add_all(scores)
        db.commit()

        print("Seeding completed successfully!")
        print("-" * 40)
        print("Admin user: admin@techkraft.com / admin123")
        print("Reviewer 1: reviewer1@techkraft.com / reviewer123")
        print("Reviewer 2: reviewer2@techkraft.com / reviewer123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
