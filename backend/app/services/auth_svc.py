"""JWT creation / validation and mock OTP logic."""
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from ..config import settings

ALGORITHM = "HS256"


def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiry_hours)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ── Mock OTP ──────────────────────────────────────────────
# In production replace with Twilio SMS delivery.
# Any 6-digit numeric code is accepted (great for demo).

def is_valid_otp(otp: str) -> bool:
    return otp.isdigit() and len(otp) == 6
