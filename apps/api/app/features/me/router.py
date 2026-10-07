"""The signed-in user's profile: GET /me (profile, plan, uploads) and PATCH /me to edit it."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel, StringConstraints

from app.auth import CurrentUser, User
from app.config import settings
from app.db import connect
from app.errors import AppError
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
    is_demo: bool


class MeIn(BaseModel):
    full_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


def _me(user: User) -> MeOut:
    return MeOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_pro=user.is_pro,
        pro_until=user.pro_until,
        uploads_this_month=uploads_this_month(user.id),
        upload_limit=None if user.is_pro else settings.free_uploads_per_month,
        is_demo=user.email == settings.demo_email,
    )


@router.get("/me", response_model=MeOut)
def read_me(user: CurrentUser) -> MeOut:
    return _me(user)


@router.patch("/me", response_model=MeOut)
def update_me(body: MeIn, user: CurrentUser) -> MeOut:
    """Changes the display name. The shared demo account can't be changed."""
    if user.email == settings.demo_email:
        raise AppError(
            403, "demo_read_only", "The demo account can't be changed. Sign up to make it yours."
        )
    with connect() as conn:
        conn.execute("update profiles set full_name = %s where id = %s", (body.full_name, user.id))
    user.full_name = body.full_name
    return _me(user)
