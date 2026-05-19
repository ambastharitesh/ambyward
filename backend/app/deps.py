from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from .database import get_session
from .models import User
from .services.auth_svc import decode_token

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = session.exec(select(User).where(User.id == payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
