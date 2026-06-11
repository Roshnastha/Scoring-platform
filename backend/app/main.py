from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.routers import candidates, auth as auth_router
from app.db.database import engine, SessionLocal
from app import models
from app.core import security as auth

# Create tables
models.Base.metadata.create_all(bind=engine)

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

def create_admin_if_not_exists():
    db = SessionLocal()
    admin_email = "admin@techkraft.com"
    admin = db.query(models.User).filter(
        models.User.email == admin_email).first()
    if not admin:
        hashed_password = auth.get_password_hash("admin123")
        new_admin = models.User(
            email=admin_email, hashed_password=hashed_password, role="admin")
        db.add(new_admin)
        db.commit()
    db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_admin_if_not_exists()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Apply rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router,
                   prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(candidates.router,
                   prefix=f"{settings.API_V1_STR}/candidates", tags=["candidates"])

@app.get("/")
def root():
    return {"message": "Welcome to Candidate Scoring Platform API"}

