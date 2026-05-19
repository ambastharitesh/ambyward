from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..models import Project, Participation, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────

class ProjectOut(BaseModel):
    id: str
    name: str
    status: str          # user's participation status (or project default if none)
    type: str
    close_date: str
    points: int
    participation_id: int | None = None


class UserOut(BaseModel):
    id: int
    phone: str
    total_points: int


# ── Helpers ───────────────────────────────────────────────

def _get_participation(session: Session, user_id: int, project_id: str) -> Participation | None:
    return session.exec(
        select(Participation)
        .where(Participation.user_id == user_id, Participation.project_id == project_id)
    ).first()


# ── Routes ────────────────────────────────────────────────

@router.get("/", response_model=list[ProjectOut])
def list_projects(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return all campaigns merged with the current user's participation status."""
    db_projects = session.exec(select(Project)).all()
    result: list[ProjectOut] = []
    for proj in db_projects:
        part = _get_participation(session, user.id, proj.id)
        result.append(ProjectOut(
            id=proj.id,
            name=proj.name,
            status=part.status if part else proj.status,
            type=proj.type,
            close_date=proj.close_date,
            points=proj.points,
            participation_id=part.id if part else None,
        ))
    return result


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(id=user.id, phone=user.phone, total_points=user.total_points)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    proj = session.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    part = _get_participation(session, user.id, project_id)
    return ProjectOut(
        id=proj.id, name=proj.name,
        status=part.status if part else proj.status,
        type=proj.type, close_date=proj.close_date, points=proj.points,
        participation_id=part.id if part else None,
    )


@router.post("/{project_id}/accept", response_model=ProjectOut)
def accept_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    proj = session.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    part = _get_participation(session, user.id, project_id)
    if part:
        if part.status != "New":
            raise HTTPException(status_code=400, detail=f"Project already {part.status}")
        part.status = "Accepted"
        part.updated_at = datetime.utcnow()
    else:
        part = Participation(user_id=user.id, project_id=project_id, status="Accepted")
        session.add(part)

    session.commit()
    session.refresh(part)
    return ProjectOut(
        id=proj.id, name=proj.name, status=part.status,
        type=proj.type, close_date=proj.close_date, points=proj.points,
        participation_id=part.id,
    )


class SubmitBody(BaseModel):
    photo_keys: list[str]
    video_key: str


@router.post("/{project_id}/submit")
def submit_project(
    project_id: str,
    body: SubmitBody,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    proj = session.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    part = _get_participation(session, user.id, project_id)
    if not part:
        # Auto-create Participation if the client somehow skipped /accept
        part = Participation(user_id=user.id, project_id=project_id, status="Accepted")
        session.add(part)
        session.commit()
        session.refresh(part)

    part.set_photo_keys(body.photo_keys)
    part.video_key = body.video_key
    part.status = "Submitted"
    part.updated_at = datetime.utcnow()
    session.commit()
    return {"message": "Submitted successfully"}


@router.post("/{project_id}/complete")
def complete_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    proj = session.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    part = _get_participation(session, user.id, project_id)
    if not part:
        raise HTTPException(status_code=400, detail="No participation record")

    part.status = "Completed"
    part.points_awarded = proj.points
    part.updated_at = datetime.utcnow()

    user.total_points += proj.points
    session.commit()

    return {"message": "Completed", "points_awarded": proj.points, "total_points": user.total_points}
