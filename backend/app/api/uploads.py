import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..deps import get_current_user
from ..models import User
from ..services.s3_svc import presigned_put
from ..config import settings

router = APIRouter()


class PhotoUrlRequest(BaseModel):
    project_id: str
    step: int           # 1 or 2


class VideoUrlRequest(BaseModel):
    project_id: str


class PresignedResponse(BaseModel):
    upload_url: str     # PUT this URL directly from the browser
    key: str            # S3 object key — send back to /submit


def _make_key(user_id: int, project_id: str, suffix: str) -> str:
    uid = uuid.uuid4().hex[:8]
    return f"users/{user_id}/{project_id}/{suffix}-{uid}"


@router.post("/photo-url", response_model=PresignedResponse)
def get_photo_upload_url(
    body: PhotoUrlRequest,
    user: User = Depends(get_current_user),
):
    if not settings.aws_access_key_id:
        # No S3 configured — return a placeholder so the frontend can still run
        key = _make_key(user.id, body.project_id, f"photo-step{body.step}")
        return PresignedResponse(upload_url="mock://no-s3-configured", key=key)

    key = _make_key(user.id, body.project_id, f"photo-step{body.step}")
    try:
        url = presigned_put(key, content_type="image/jpeg")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return PresignedResponse(upload_url=url, key=key)


@router.post("/video-url", response_model=PresignedResponse)
def get_video_upload_url(
    body: VideoUrlRequest,
    user: User = Depends(get_current_user),
):
    if not settings.aws_access_key_id:
        key = _make_key(user.id, body.project_id, "video")
        return PresignedResponse(upload_url="mock://no-s3-configured", key=key)

    key = _make_key(user.id, body.project_id, "video")
    try:
        url = presigned_put(key, content_type="video/webm")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return PresignedResponse(upload_url=url, key=key)
