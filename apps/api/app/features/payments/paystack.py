"""The two Paystack calls we need: start a checkout, then check it. Amounts in minor units."""

import httpx

from app.config import settings
from app.errors import AppError

BASE = "https://api.paystack.co"
TIMEOUT = httpx.Timeout(15.0, connect=5.0)


def _request(method: str, path: str, json: dict | None = None) -> dict:
    if not settings.paystack_secret_key:
        raise AppError(503, "payments_not_configured", "Payments aren't set up yet.")
    try:
        res = httpx.request(
            method,
            f"{BASE}{path}",
            json=json,
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"},
            timeout=TIMEOUT,
        )
    except httpx.HTTPError as e:
        raise AppError(502, "payment_provider_down", "Paystack didn't respond. Try again.") from e
    body = res.json()
    if res.status_code >= 400 or not body.get("status"):
        raise AppError(502, "payment_provider_error", body.get("message") or "Paystack said no.")
    return body["data"]


def initialize(
    *,
    email: str,
    amount_minor: int,
    currency: str,
    reference: str,
    callback_url: str,
    metadata: dict,
) -> str:
    """Starts a checkout and returns the page to send the user to."""
    data = _request(
        "POST",
        "/transaction/initialize",
        {
            "email": email,
            "amount": amount_minor,
            "currency": currency,
            "reference": reference,
            "callback_url": callback_url,
            "metadata": metadata,
        },
    )
    return data["authorization_url"]


def verify(reference: str) -> dict:
    """Returns Paystack's record of the transaction: status, amount, currency."""
    return _request("GET", f"/transaction/verify/{reference}")
