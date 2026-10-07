"""GET /me: the signed-in user's profile, plan and upload allowance."""

from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from app.auth import CurrentUser
from app.config import settings
from app.features.statements.logic import uploads_this_month

router = APIRouter(tags=["me"])


class MeOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_pro: bool
    pro_until: datetime | None
    uploads_this_month: int
    upload_limit: int | None  # None means unlimited (Pro)


@router.get("/me", response_model=MeOut)
def read_me(user: CurrentUser) -> MeOut:
    return MeOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_pro=user.is_pro,
        pro_until=user.pro_until,
        uploads_this_month=uploads_this_month(user.id),
        upload_limit=None if user.is_pro else settings.free_uploads_per_month,
    )
