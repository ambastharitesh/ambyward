from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..deps import get_current_user
from ..models import Participation, Project, User
from ..services.s3_svc import presigned_get
from ..services import ai_svc
from ..config import settings

router = APIRouter()


class VerifyResult(BaseModel):
    visual_passed: bool
    context_passed: bool
    passed: bool
    visual_details: list[dict]
    context_score: int
    context_summary: str
    context_reason: str


@router.post("/{project_id}", response_model=VerifyResult)
async def verify_project(
    project_id: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    proj = session.get(Project, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    part = session.exec(
        select(Participation)
        .where(Participation.user_id == user.id, Participation.project_id == project_id)
    ).first()
    if not part:
        # No submission — mock-pass (demo resilience). Real prod would 400.
        return VerifyResult(
            visual_passed=True,
            context_passed=True,
            passed=True,
            visual_details=[],
            context_score=90,
            context_summary="No submission record — auto-passed (demo).",
            context_reason="Demo mode",
        )

    # ── 1. Visual Integrity — check each photo ────────────
    photo_keys = part.get_photo_keys()
    visual_details: list[dict] = []

    for i, key in enumerate(photo_keys, start=1):
        step = i  # photo keys are ordered by step
        if key.startswith("mock://") or not settings.aws_access_key_id:
            visual_details.append({"step": step, "passed": True, "reason": "Mock pass (no S3)"})
            continue
        url = presigned_get(key)
        result = await ai_svc.check_photo(url, step)
        result["step"] = step
        visual_details.append(result)

    visual_passed = all(d.get("passed", False) for d in visual_details) if visual_details else True

    # ── 2. Context Analysis — Whisper + GPT-4o ────────────
    context_result: dict = {}
    if not part.video_key or part.video_key.startswith("mock://") or not settings.aws_access_key_id:
        context_result = {
            "passed": True, "score": 90,
            "summary": "Mock pass (no video or S3 configured).",
            "reason": "Demo mode",
        }
    else:
        video_url = presigned_get(part.video_key)
        transcript = await ai_svc.transcribe_video(video_url)
        context_result = await ai_svc.evaluate_transcript(transcript, proj.name)

    context_passed = context_result.get("passed", False)
    overall_passed = visual_passed and context_passed

    # Persist result
    part.set_verify_result({
        "visual_passed": visual_passed,
        "context_passed": context_passed,
        "passed": overall_passed,
        "visual_details": visual_details,
        "context": context_result,
    })
    session.commit()

    return VerifyResult(
        visual_passed=visual_passed,
        context_passed=context_passed,
        passed=overall_passed,
        visual_details=visual_details,
        context_score=context_result.get("score", 0),
        context_summary=context_result.get("summary", ""),
        context_reason=context_result.get("reason", ""),
    )
