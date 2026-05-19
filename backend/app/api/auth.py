from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..models import User
from ..services.auth_svc import create_token, is_valid_otp

router = APIRouter()


class OtpRequest(BaseModel):
    phone: str


class OtpVerify(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    token: str
    user_id: int
    phone: str
    total_points: int


@router.post("/request-otp", status_code=200)
def request_otp(body: OtpRequest, session: Session = Depends(get_session)):
    """
    In production: send an SMS via Twilio.
    In dev/demo: any 6-digit code will be accepted — just return success.
    """
    phone = body.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")

    # Upsert user so they exist when OTP is verified
    user = session.exec(select(User).where(User.phone == phone)).first()
    if not user:
        # Demo mode: seed new users with a starting balance so the dashboard
        # is not empty on first login.
        user = User(phone=phone, total_points=32450)
        session.add(user)
        session.commit()

    return {"message": "OTP sent (any 6-digit code is valid in demo mode)"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(body: OtpVerify, session: Session = Depends(get_session)):
    if not is_valid_otp(body.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP must be exactly 6 digits",
        )

    user = session.exec(select(User).where(User.phone == body.phone.strip())).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found — request OTP first")

    token = create_token(user.id)
    return TokenResponse(
        token=token,
        user_id=user.id,
        phone=user.phone,
        total_points=user.total_points,
    )
