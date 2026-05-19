from __future__ import annotations
import json
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phone: str = Field(unique=True, index=True)
    total_points: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Project(SQLModel, table=True):
    """Campaign definitions (seeded on startup)."""
    id: str = Field(primary_key=True)
    name: str
    status: str   # New | Accepted | Submitted | Completed | Expired
    type: str
    close_date: str
    points: int


class Participation(SQLModel, table=True):
    """Tracks a user's relationship to a project."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    status: str = Field(default="New")          # mirrors Project.status lifecycle
    photo_keys: str = Field(default="[]")       # JSON list of S3 object keys
    video_key: str = Field(default="")          # S3 object key of the recorded video
    verify_result: str = Field(default="{}")    # JSON from AI verification
    points_awarded: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # ── helpers ───────────────────────────────────────────
    def get_photo_keys(self) -> list[str]:
        return json.loads(self.photo_keys)

    def set_photo_keys(self, keys: list[str]) -> None:
        self.photo_keys = json.dumps(keys)

    def get_verify_result(self) -> dict:
        return json.loads(self.verify_result)

    def set_verify_result(self, result: dict) -> None:
        self.verify_result = json.dumps(result)
