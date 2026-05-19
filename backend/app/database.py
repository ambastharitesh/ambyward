from sqlmodel import SQLModel, create_engine, Session
from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite only
    echo=False,
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


# ── Seed data ─────────────────────────────────────────────
SEED_PROJECTS = [
    {"id": "p1", "name": "Whole Foods Beverage Taste Test",  "status": "New",       "type": "in-store",        "close_date": "Jun 20", "points": 1000},
    {"id": "p2", "name": "Skincare Routine Feedback",        "status": "New",       "type": "survey + at-home","close_date": "Jun 25", "points": 1500},
    {"id": "p3", "name": "Summer Snack Review",              "status": "Accepted",  "type": "at-home",         "close_date": "Jun 18", "points": 800},
    {"id": "p4", "name": "Coffee Brand Awareness Survey",    "status": "Submitted", "type": "survey",          "close_date": "Jun 10", "points": 600},
    {"id": "p5", "name": "Laptop Accessory Unboxing",        "status": "Completed", "type": "at-home",         "close_date": "May 30", "points": 1200},
    {"id": "p6", "name": "Home Cleaning Product Test",       "status": "Expired",   "type": "in-store",        "close_date": "May 15", "points": 700},
    {"id": "p7", "name": "Meal Kit Delivery Review",         "status": "Completed", "type": "online",          "close_date": "May 22", "points": 950},
]


def seed_projects(session: Session) -> None:
    from .models import Project
    from sqlmodel import select
    for data in SEED_PROJECTS:
        existing = session.exec(select(Project).where(Project.id == data["id"])).first()
        if not existing:
            session.add(Project(**data))
    session.commit()
