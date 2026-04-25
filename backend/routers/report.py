"""Savings opportunity report endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from core.plans import require_pro
from db.supabase import get_supabase_user
from schemas.auth import CurrentUser
from services.report_service import generate_savings_report

router = APIRouter(prefix="/report", tags=["report"])


@router.post("/savings")
async def savings_report(user: CurrentUser = Depends(require_pro)):
    sb = get_supabase_user(user.access_token)
    return generate_savings_report(sb, user.id)
