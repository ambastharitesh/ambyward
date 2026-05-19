from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import create_db_and_tables, get_session, seed_projects
from .api import auth, projects, uploads, verify
from sqlmodel import Session
from .database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    with Session(engine) as session:
        seed_projects(session)
    yield


app = FastAPI(title="RewardLens API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(uploads.router,  prefix="/api/uploads",  tags=["uploads"])
app.include_router(verify.router,   prefix="/api/verify",   tags=["verify"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
