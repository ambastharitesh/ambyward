"""AWS S3 helpers — presigned upload / download URLs."""
import boto3
from botocore.exceptions import ClientError
from ..config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
    return _client


def presigned_put(key: str, content_type: str = "application/octet-stream", expires: int = 3600) -> str:
    """Return a presigned URL the client can PUT a file to directly."""
    try:
        url = _get_client().generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=expires,
        )
        return url
    except ClientError as e:
        raise RuntimeError(f"S3 presign error: {e}") from e


def presigned_get(key: str, expires: int = 3600) -> str:
    """Return a presigned URL the backend can GET (for AI processing)."""
    try:
        return _get_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": key},
            ExpiresIn=expires,
        )
    except ClientError as e:
        raise RuntimeError(f"S3 presign error: {e}") from e


def object_exists(key: str) -> bool:
    try:
        _get_client().head_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except ClientError:
        return False
