"""
Paystack API wrapper.

We use Paystack over plain HTTP (httpx) — there's no official Python SDK
we need here. Three operations are used by our backend:

- initialize_transaction: start a one-time or first-subscription payment.
  Returns an authorization URL we redirect the user to.

- verify_transaction: confirm a transaction after Paystack redirects the
  user back. This is the source of truth for "did the money land?"

- verify_webhook_signature: validates the x-paystack-signature HMAC on
  incoming webhooks so we don't trust spoofed events.

All amounts to Paystack are in the currency's smallest unit:
  - NGN → kobo (multiply NGN by 100)
  - USD → cents (multiply USD by 100)
We convert at the service boundary so the rest of the code uses decimal units.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from decimal import Decimal
from typing import Any, Literal

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

PAYSTACK_BASE = "https://api.paystack.co"
Currency = Literal["NGN", "USD"]


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------
def _headers() -> dict[str, str]:
    if not settings.paystack_secret_key:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not set")
    return {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
        "Content-Type": "application/json",
    }


async def _post(path: str, json: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}{path}", headers=_headers(), json=json
        )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        raise RuntimeError(f"Paystack error: {data.get('message')}")
    return data["data"]


async def _get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{PAYSTACK_BASE}{path}", headers=_headers())
    resp.raise_for_status()
    data = resp.json()
    if not data.get("status"):
        raise RuntimeError(f"Paystack error: {data.get('message')}")
    return data["data"]


# ---------------------------------------------------------------------------
# Transaction lifecycle
# ---------------------------------------------------------------------------
def _to_subunit(amount: Decimal | float | int, currency: Currency) -> int:
    """Convert human amount (₦1000, $9.99) → Paystack subunit (100000 kobo, 999 cents)."""
    return int(Decimal(str(amount)) * 100)


async def initialize_transaction(
    *,
    email: str,
    amount: Decimal | float,
    currency: Currency,
    callback_url: str,
    metadata: dict[str, Any],
    plan_code: str | None = None,
) -> dict:
    """
    Start a Paystack transaction.

    If plan_code is provided, Paystack treats this as a subscription —
    after the first charge, Paystack auto-charges on the plan's interval.
    If omitted, it's a one-time payment.

    Returns { authorization_url, access_code, reference }.
    """
    payload: dict[str, Any] = {
        "email": email,
        "amount": _to_subunit(amount, currency),
        "currency": currency,
        "callback_url": callback_url,
        "metadata": metadata,
    }
    if plan_code:
        payload["plan"] = plan_code

    return await _post("/transaction/initialize", payload)


async def verify_transaction(reference: str) -> dict:
    """Fetch full transaction state for `reference`. Used after redirect."""
    return await _get(f"/transaction/verify/{reference}")


async def disable_subscription(subscription_code: str, email_token: str) -> dict:
    """Cancel an auto-recurring subscription."""
    return await _post(
        "/subscription/disable",
        {"code": subscription_code, "token": email_token},
    )


# ---------------------------------------------------------------------------
# Webhook signature
# ---------------------------------------------------------------------------
def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """
    Paystack signs webhooks with HMAC-SHA512 over the raw body using your
    secret key. Compare in constant time to avoid timing attacks.
    """
    if not signature_header:
        return False
    if not settings.paystack_secret_key:
        logger.error("Webhook received but PAYSTACK_SECRET_KEY is unset")
        return False

    expected = hmac.new(
        settings.paystack_secret_key.encode(),
        raw_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
