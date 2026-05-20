import logging

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
log = logging.getLogger("verify")

# Minimum acceptable photos: must have at least 1 of the 2 captures.
# Less than this and the submission is treated as incomplete (fails the check).
_MIN_PHOTOS = 1


class VerifyResult(BaseModel):
    visual_passed: bool
    context_passed: bool
    passed: bool
    visual_details: list[dict]
    context_score: int
    context_summary: str
    context_reason: str
    # Per-question breakdown (9 items) from GPT-4o transcript evaluation.
    # Each item: {id, category, question, answered, score, snippet, reason}.
    per_question: list[dict] = []


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
        # Genuinely missing participation — fail with a clear reason instead of mock-passing.
        log.warning("verify[%s] no participation for user=%s", project_id, user.id)
        return VerifyResult(
            visual_passed=False,
            context_passed=False,
            passed=False,
            visual_details=[],
            context_score=0,
            context_summary="",
            context_reason="No submission found. Please complete the journey and try again.",
            per_question=[],
        )

    # ── 1. Visual Integrity — check each photo ────────────
    photo_keys = part.get_photo_keys()
    log.info(
        "verify[%s] user=%s photos=%d video_key=%r",
        project_id, user.id, len(photo_keys), part.video_key,
    )

    visual_details: list[dict] = []
    aws_configured = bool(settings.aws_access_key_id)

    for i, key in enumerate(photo_keys, start=1):
        step = i  # photo keys are ordered by step
        if key.startswith("mock://"):
            # Genuinely a mock — never auto-pass in this case either; mark failed so the
            # user understands the upload didn't happen.
            visual_details.append({"step": step, "passed": False, "reason": "Photo not uploaded (mock key)"})
            continue
        if not aws_configured:
            # AWS keys absent on the server — this is a config issue, not the user's fault.
            # Auto-pass with a clear note.
            visual_details.append({"step": step, "passed": True, "reason": "S3 not configured on server — auto-passed"})
            continue
        url = presigned_get(key)
        result = await ai_svc.check_photo(url, step)
        result["step"] = step
        visual_details.append(result)

    # Fail if no photos were ever uploaded.
    if len(photo_keys) < _MIN_PHOTOS:
        visual_passed = False
        visual_details.append({
            "step": 0,
            "passed": False,
            "reason": f"Only {len(photo_keys)} photo(s) submitted — need at least {_MIN_PHOTOS}.",
        })
    else:
        visual_passed = all(d.get("passed", False) for d in visual_details)

    # ── 2. Context Analysis — Whisper + GPT-4o ────────────
    context_result: dict
    has_video = bool(part.video_key) and not part.video_key.startswith("mock://")

    if not has_video and not aws_configured:
        # Server isn't configured — give a clear mock-pass note.
        context_result = {
            "passed": True, "score": 90,
            "summary": "S3 not configured on server — auto-passed.",
            "reason": "Server config",
            "per_question": [],
        }
    elif not has_video:
        # User did not produce a real upload — fail with reason.
        context_result = {
            "passed": False, "score": 0,
            "summary": "",
            "reason": "Video was not uploaded successfully. Please re-record and try again.",
            "per_question": [],
        }
    else:
        video_url = presigned_get(part.video_key)
        transcript = await ai_svc.transcribe_video(video_url)
        log.info("verify[%s] transcript_len=%d", project_id, len(transcript or ""))
        context_result = await ai_svc.evaluate_transcript(transcript, proj.name)

    context_passed = context_result.get("passed", False)
    overall_passed = visual_passed and context_passed
    log.info(
        "verify[%s] user=%s visual=%s context=%s overall=%s reason=%r",
        project_id, user.id, visual_passed, context_passed, overall_passed,
        context_result.get("reason", ""),
    )

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
        per_question=context_result.get("per_question", []),
    )
