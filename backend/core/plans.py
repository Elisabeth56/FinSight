"""
Plan definitions + FastAPI gating dependencies.

Two dependencies to drop into routes:

- require_pro() — 402 if the user isn't on the Pro plan.
- check_upload_quota() — 402 if the free user has already uploaded this month.

Prices live here (not the DB) so they can be changed without migrations.
Paystack plan codes are configured via env vars so dev/prod can use different plans.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, TypedDict

from fastapi import Depends, HTTPException, status

from core.auth import get_current_user
from core.config import settings
from db.supabase import get_supabase_admin
from schemas.auth import CurrentUser


Currency = Literal["NGN", "USD"]
PlanId = Literal["free", "pro_monthly", "pro_yearly", "pro_lifetime"]


class PlanPrice(TypedDict):
    NGN: int
    USD: int  # in whole dollars; the service layer converts to cents


class PlanDef(TypedDict):
    id: PlanId
    name: str
    price: PlanPrice
    interval: Literal["monthly", "yearly", "one_time"] | None
    # Paystack plan codes — subscriptions need these pre-created in the dashboard.
    paystack_plan_code: dict[Currency, str] | None


# ---------------------------------------------------------------------------
# Plan catalog
# ---------------------------------------------------------------------------
# Paystack plan codes come from env so you can point staging/prod at different
# plans without code changes. Create plans in Paystack dashboard (one per
# currency/interval combo) and paste the codes into the .env file.
PLANS: list[PlanDef] = [
    {
        "id": "free",
        "name": "Free",
        "price": {"NGN": 0, "USD": 0},
        "interval": None,
        "paystack_plan_code": None,
    },
    {
        "id": "pro_monthly",
        "name": "Pro — Monthly",
        "price": {"NGN": 4500, "USD": 5},
        "interval": "monthly",
        "paystack_plan_code": {
            "NGN": settings.paystack_plan_monthly_ngn,
            "USD": settings.paystack_plan_monthly_usd,
        },
    },
    {
        "id": "pro_yearly",
        "name": "Pro — Yearly",
        "price": {"NGN": 45000, "USD": 50},
        "interval": "yearly",
        "paystack_plan_code": {
            "NGN": settings.paystack_plan_yearly_ngn,
            "USD": settings.paystack_plan_yearly_usd,
        },
    },
    {
        "id": "pro_lifetime",
        "name": "Pro — One-time (1 year access)",
        "price": {"NGN": 30000, "USD": 35},
        "interval": "one_time",
        "paystack_plan_code": None,  # one-time payments skip Paystack plans
    },
]


def get_plan(plan_id: str) -> PlanDef | None:
    for p in PLANS:
        if p["id"] == plan_id:
            return p
    return None


# ---------------------------------------------------------------------------
# Gating dependencies
# ---------------------------------------------------------------------------
FREE_UPLOADS_PER_MONTH = 1


async def require_pro(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Deny non-Pro users. Returns the user if Pro."""
    if user.plan != "pro":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "pro_required",
                "message": "This feature is available on the Pro plan.",
            },
        )
    return user


async def check_upload_quota(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """
    Enforce the free tier's 1-statement-per-month limit.
    Pro users pass through unconditionally.
    """
    if user.plan == "pro":
        return user

    # Count this month's statements via the admin client (view is RLS-free for
    # read, but the caller is trusted here — we already verified the JWT).
    admin = get_supabase_admin()
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    count_resp = (
        admin.table("statements")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .gte("created_at", month_start.isoformat())
        .execute()
    )
    count = count_resp.count or 0

    if count >= FREE_UPLOADS_PER_MONTH:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "upload_quota_exceeded",
                "message": (
                    f"Free plan is limited to {FREE_UPLOADS_PER_MONTH} "
                    "statement per month. Upgrade to Pro for unlimited uploads."
                ),
                "quota": FREE_UPLOADS_PER_MONTH,
                "used": count,
            },
        )
    return user
