"""Payments: plans, checkout, verification on return, and pending checkouts to heal."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.auth import CurrentUser
from app.features.payments import logic
from app.features.payments.logic import Currency, PaymentStatus, PlanId

router = APIRouter(tags=["payments"])


class PlanOut(BaseModel):
    id: str
    name: str
    days: int
    prices_minor: dict[str, int]


class CheckoutIn(BaseModel):
    plan_id: PlanId
    currency: Currency = "NGN"


class CheckoutOut(BaseModel):
    authorization_url: str
    reference: str


@router.get("/plans", response_model=list[PlanOut])
def plans() -> list[PlanOut]:
    return [
        PlanOut(
            id=key, name=p["name"], days=p["days"], prices_minor={"NGN": p["NGN"], "USD": p["USD"]}
        )
        for key, p in logic.PLANS.items()
    ]


@router.post("/payments", response_model=CheckoutOut, status_code=201)
def checkout(body: CheckoutIn, user: CurrentUser) -> CheckoutOut:
    url, reference = logic.start_checkout(user, body.plan_id, body.currency)
    return CheckoutOut(authorization_url=url, reference=reference)


@router.post("/payments/{reference}/verify", response_model=PaymentStatus)
def verify(reference: str, user: CurrentUser) -> PaymentStatus:
    return logic.verify_payment(user, reference)


@router.get("/payments/pending", response_model=list[str])
def pending(user: CurrentUser) -> list[str]:
    return logic.pending_references(user.id)
