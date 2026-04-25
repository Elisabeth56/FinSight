"""
Paystack-powered payments.

Flow:

1. User clicks "Upgrade" on /dashboard/billing
   → POST /payments/initialize { plan_id, currency, payment_type }
   → Backend calls Paystack → returns authorization_url
   → Frontend redirects the user to authorization_url.

2. User pays on Paystack, gets redirected to our callback URL
   with ?reference=... and ?trxref=...
   → Frontend calls GET /payments/verify/{reference}
   → Backend verifies with Paystack, updates subscriptions + users.plan

3. Paystack webhooks arrive asynchronously
   → POST /payments/webhook
   → Signature verified, event logged, subscription state synced.
   This is the source of truth for recurring charges.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user
from core.config import settings
from core.plans import PLANS, PlanId, get_plan
from db.supabase import get_supabase_admin, get_supabase_user
from schemas.auth import CurrentUser
from services import paystack

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class InitializeRequest(BaseModel):
    plan_id: PlanId
    currency: Literal["NGN", "USD"]
    payment_type: Literal["one_time", "subscription"]


class InitializeResponse(BaseModel):
    authorization_url: str
    reference: str


class SubscriptionStatus(BaseModel):
    plan: str
    status: str  # 'active' | 'inactive' | 'cancelled' | 'past_due'
    payment_type: str | None = None
    current_period_end: str | None = None
    amount: float | None = None
    currency: str | None = None


# ---------------------------------------------------------------------------
# Public plan catalog
# ---------------------------------------------------------------------------
@router.get("/plans")
async def list_plans():
    """Return plan catalog for the billing page."""
    return {
        "plans": [
            {
                "id": p["id"],
                "name": p["name"],
                "price": p["price"],
                "interval": p["interval"],
            }
            for p in PLANS
        ],
        "free_upload_quota": 1,
    }


# ---------------------------------------------------------------------------
# Initialize
# ---------------------------------------------------------------------------
@router.post("/initialize", response_model=InitializeResponse)
async def initialize(
    body: InitializeRequest,
    user: CurrentUser = Depends(get_current_user),
):
    plan = get_plan(body.plan_id)
    if not plan or plan["id"] == "free":
        raise HTTPException(400, "Invalid plan")

    # Validate the plan type matches what's requested
    if body.payment_type == "subscription":
        if plan["interval"] not in ("monthly", "yearly"):
            raise HTTPException(
                400,
                "Subscriptions are only available for monthly or yearly plans.",
            )
        plan_code = (plan["paystack_plan_code"] or {}).get(body.currency)
        if not plan_code:
            raise HTTPException(
                500,
                f"No Paystack plan configured for {body.plan_id} in {body.currency}. "
                "Create it in the Paystack dashboard and set PAYSTACK_PLAN_* env vars.",
            )
    else:  # one_time
        if plan["interval"] not in ("one_time", "monthly", "yearly"):
            raise HTTPException(400, "Invalid plan for one-time payment.")
        plan_code = None

    amount = plan["price"][body.currency]
    callback_url = f"{settings.frontend_origin}/billing/callback"

    try:
        result = await paystack.initialize_transaction(
            email=user.email,
            amount=amount,
            currency=body.currency,
            callback_url=callback_url,
            plan_code=plan_code,
            metadata={
                "user_id": user.id,
                "plan_id": body.plan_id,
                "payment_type": body.payment_type,
            },
        )
    except Exception as e:
        logger.exception("Paystack initialize failed")
        raise HTTPException(502, f"Payment provider error: {e}")

    return InitializeResponse(
        authorization_url=result["authorization_url"],
        reference=result["reference"],
    )


# ---------------------------------------------------------------------------
# Verify (post-redirect)
# ---------------------------------------------------------------------------
@router.get("/verify/{reference}")
async def verify(
    reference: str,
    user: CurrentUser = Depends(get_current_user),
):
    """
    Called by the frontend after Paystack redirects back.
    Confirms the charge landed, then updates the user's plan.
    """
    try:
        tx = await paystack.verify_transaction(reference)
    except Exception as e:
        raise HTTPException(502, f"Could not verify transaction: {e}")

    if tx.get("status") != "success":
        return {"ok": False, "status": tx.get("status"), "message": tx.get("gateway_response")}

    meta = tx.get("metadata") or {}
    # Sanity: the metadata user_id must match the caller.
    if meta.get("user_id") and meta["user_id"] != user.id:
        raise HTTPException(403, "Transaction does not belong to this user")

    _activate_subscription(
        user_id=user.id,
        reference=reference,
        tx=tx,
        payment_type=meta.get("payment_type", "one_time"),
    )

    return {
        "ok": True,
        "plan": meta.get("plan_id"),
        "amount": tx.get("amount", 0) / 100,
        "currency": tx.get("currency"),
    }


# ---------------------------------------------------------------------------
# Current subscription
# ---------------------------------------------------------------------------
@router.get("/subscription", response_model=SubscriptionStatus)
async def get_subscription(user: CurrentUser = Depends(get_current_user)):
    sb = get_supabase_user(user.access_token)
    rows = (
        sb.table("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        return SubscriptionStatus(plan=user.plan, status="inactive")

    row = rows[0]
    return SubscriptionStatus(
        plan=user.plan,
        status=row["status"],
        payment_type=row.get("payment_type"),
        current_period_end=row.get("current_period_end"),
        amount=float(row["amount"]) if row.get("amount") else None,
        currency=row.get("currency"),
    )


# ---------------------------------------------------------------------------
# Webhook
# ---------------------------------------------------------------------------
@router.post("/webhook", include_in_schema=False)
async def webhook(
    request: Request,
    x_paystack_signature: str | None = Header(default=None),
):
    """
    Paystack webhook receiver.

    IMPORTANT: do not parse the body before verifying the signature —
    we need the raw bytes for HMAC comparison.
    """
    raw = await request.body()
    if not paystack.verify_webhook_signature(raw, x_paystack_signature):
        logger.warning("Rejected webhook with invalid signature")
        raise HTTPException(401, "Invalid signature")

    try:
        event = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")

    event_type = event.get("event", "")
    data = event.get("data", {})
    paystack_event_id = str(data.get("id") or event.get("id") or "")

    # Idempotency — skip events we've already processed
    admin = get_supabase_admin()
    if paystack_event_id:
        existing = (
            admin.table("payment_events")
            .select("id")
            .eq("paystack_event_id", paystack_event_id)
            .limit(1)
            .execute()
            .data
        )
        if existing:
            return {"ok": True, "duplicate": True}

    # Resolve the user via metadata
    meta = (data.get("metadata") or {}) if isinstance(data.get("metadata"), dict) else {}
    user_id = meta.get("user_id")
    reference = data.get("reference")

    # Log every event — audit + debugging
    admin.table("payment_events").insert(
        {
            "paystack_event_id": paystack_event_id or None,
            "event_type": event_type,
            "reference": reference,
            "user_id": user_id,
            "payload": event,
        }
    ).execute()

    # Dispatch
    if event_type == "charge.success":
        _handle_charge_success(data, user_id)
    elif event_type == "subscription.create":
        _handle_subscription_create(data, user_id)
    elif event_type in ("subscription.disable", "subscription.not_renew"):
        _handle_subscription_disable(data, user_id)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(data, user_id)
    else:
        logger.info("Unhandled Paystack event: %s", event_type)

    return {"ok": True}


# ---------------------------------------------------------------------------
# Webhook handlers (kept sync — Supabase client is sync)
# ---------------------------------------------------------------------------
def _activate_subscription(
    *,
    user_id: str,
    reference: str,
    tx: dict,
    payment_type: str,
) -> None:
    admin = get_supabase_admin()
    amount_subunit = tx.get("amount", 0)
    currency = tx.get("currency", "NGN")
    amount = amount_subunit / 100

    # Period end: subscription → from Paystack's next_payment_date
    #              one-time   → 30 days (monthly plan) or 365 days (yearly/lifetime)
    period_end = tx.get("next_payment_date") or _default_period_end(
        tx.get("plan_object", {}).get("interval"), payment_type
    )

    admin.table("subscriptions").upsert(
        {
            "user_id": user_id,
            "paystack_reference": reference,
            "paystack_customer_code": tx.get("customer", {}).get("customer_code"),
            "paystack_subscription_code": tx.get("subscription", {}).get("subscription_code")
                if isinstance(tx.get("subscription"), dict) else None,
            "plan_code": tx.get("plan") or None,
            "payment_type": payment_type,
            "status": "active",
            "amount": amount,
            "currency": currency,
            "current_period_end": period_end,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="paystack_reference",
    ).execute()

    admin.table("users").update({"plan": "pro"}).eq("id", user_id).execute()


def _default_period_end(interval: str | None, payment_type: str) -> str:
    """Best-effort fallback when Paystack doesn't give us a next_payment_date."""
    from datetime import timedelta

    days = 365 if interval == "annually" or payment_type == "one_time" else 30
    end = datetime.now(timezone.utc) + timedelta(days=days)
    return end.isoformat()


def _handle_charge_success(data: dict, user_id: str | None) -> None:
    if not user_id:
        return
    meta = data.get("metadata") or {}
    _activate_subscription(
        user_id=user_id,
        reference=data.get("reference", ""),
        tx=data,
        payment_type=meta.get("payment_type", "one_time"),
    )


def _handle_subscription_create(data: dict, user_id: str | None) -> None:
    """Paystack confirms a subscription was created. Keep our code/status in sync."""
    if not user_id:
        return
    admin = get_supabase_admin()
    admin.table("subscriptions").update(
        {
            "paystack_subscription_code": data.get("subscription_code"),
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("user_id", user_id).eq("status", "active").execute()


def _handle_subscription_disable(data: dict, user_id: str | None) -> None:
    if not user_id:
        return
    admin = get_supabase_admin()
    admin.table("subscriptions").update(
        {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).execute()
    # Don't flip the user to free immediately — they paid for the period.
    # The current_period_end check handles effective expiry.


def _handle_payment_failed(data: dict, user_id: str | None) -> None:
    if not user_id:
        return
    admin = get_supabase_admin()
    admin.table("subscriptions").update(
        {"status": "past_due", "updated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).execute()
