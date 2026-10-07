"""One-time Pro passes (ADR 005): start a Paystack checkout, verify it when the user returns,
extend `pro_until`. No webhooks, no subscriptions, nothing renews by itself."""

import secrets
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.auth import User
from app.config import settings
from app.db import connect
from app.errors import AppError
from app.features.payments import paystack

PlanId = Literal["pro_month", "pro_year"]
Currency = Literal["NGN", "USD"]

# prices in kobo / cents
PLANS: dict[str, dict] = {
    "pro_month": {"name": "Pro · 1 month", "days": 30, "NGN": 450_000, "USD": 500},
    "pro_year": {"name": "Pro · 1 year", "days": 365, "NGN": 3_000_000, "USD": 3_500},
}


class PaymentStatus(BaseModel):
    reference: str
    status: Literal["pending", "paid", "failed"]
    pro_until: datetime | None = None


def start_checkout(user: User, plan_id: PlanId, currency: Currency) -> tuple[str, str]:
    """Records a pending payment and returns (authorization_url, reference)."""
    plan = PLANS[plan_id]
    reference = f"fs_{secrets.token_hex(10)}"
    # Paystack appends ?reference=...; the billing page verifies it on load
    callback = f"{settings.app_url}/dashboard/billing"

    with connect() as conn:
        conn.execute(
            "insert into payments (user_id, reference, plan_id, amount_minor, currency)"
            " values (%s, %s, %s, %s, %s)",
            (user.id, reference, plan_id, plan[currency], currency),
        )
    url = paystack.initialize(
        email=user.email,
        amount_minor=plan[currency],
        currency=currency,
        reference=reference,
        callback_url=callback,
        metadata={"app": "finsight", "user_id": user.id, "plan_id": plan_id},
    )
    return url, reference


def verify_payment(user: User, reference: str) -> PaymentStatus:
    """Checks with Paystack and, the first time a payment succeeds, extends Pro. Safe to repeat."""
    with connect() as conn:
        payment = conn.execute(
            "select reference, plan_id, amount_minor, currency, status from payments"
            " where reference = %s and user_id = %s",
            (reference, user.id),
        ).fetchone()
    if payment is None:
        raise AppError(404, "payment_not_found", "We couldn't find that payment.")
    if payment["status"] != "pending":
        return PaymentStatus(
            reference=reference, status=payment["status"], pro_until=user.pro_until
        )

    record = paystack.verify(reference)
    # Paystack must agree on the amount and currency we asked for, not just say "success"
    paid = (
        record.get("status") == "success"
        and record.get("amount") == payment["amount_minor"]
        and record.get("currency") == payment["currency"].strip()
    )
    if record.get("status") in ("abandoned", "ongoing", "pending") and not paid:
        return PaymentStatus(reference=reference, status="pending", pro_until=user.pro_until)

    days = PLANS[payment["plan_id"]]["days"]
    with connect() as conn, conn.transaction():
        # the status guard makes a second verify (two tabs, a refresh) a no-op
        updated = conn.execute(
            "update payments set status = %s, paid_at = case when %s then now() end"
            " where reference = %s and status = 'pending' returning reference",
            ("paid" if paid else "failed", paid, reference),
        ).fetchone()
        pro_until = user.pro_until
        if updated and paid:
            # stacking: a new pass starts when the current one ends, not today
            row = conn.execute(
                "update profiles set pro_until = greatest(coalesce(pro_until, now()), now())"
                " + make_interval(days => %s) where id = %s returning pro_until",
                (days, user.id),
            ).fetchone()
            pro_until = row["pro_until"] if row else pro_until
    return PaymentStatus(
        reference=reference, status="paid" if paid else "failed", pro_until=pro_until
    )


def pending_references(user_id: str) -> list[str]:
    """Checkouts from the last day that never came back; the billing page re-verifies these."""
    with connect() as conn:
        rows = conn.execute(
            "select reference from payments where user_id = %s and status = 'pending'"
            " and created_at > now() - interval '1 day' order by created_at desc",
            (user_id,),
        ).fetchall()
    return [r["reference"] for r in rows]
