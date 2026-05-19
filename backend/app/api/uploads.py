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
    # MIME type the client will PUT with. Must match SigV4 signed Content-Type.
    # Android Chrome → "video/webm", iOS Safari → "video/mp4".
    content_type: str = "video/webm"


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


_ALLOWED_VIDEO_TYPES = {"video/webm", "video/mp4"}
_EXT_FOR_VIDEO_TYPE = {"video/webm": "webm", "video/mp4": "mp4"}


@router.post("/video-url", response_model=PresignedResponse)
def get_video_upload_url(
    body: VideoUrlRequest,
    user: User = Depends(get_current_user),
):
    ct = (body.content_type or "video/webm").split(";")[0].strip().lower()
    if ct not in _ALLOWED_VIDEO_TYPES:
        ct = "video/webm"
    ext = _EXT_FOR_VIDEO_TYPE[ct]

    if not settings.aws_access_key_id:
        key = _make_key(user.id, body.project_id, f"video.{ext}")
        return PresignedResponse(upload_url="mock://no-s3-configured", key=key)

    key = _make_key(user.id, body.project_id, f"video.{ext}")
    try:
        url = presigned_put(key, content_type=ct)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return PresignedResponse(upload_url=url, key=key)
