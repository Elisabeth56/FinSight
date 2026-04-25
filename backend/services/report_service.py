"""
Savings opportunity report.

We compute real aggregates (total spend per category over the last 90 days,
top merchants, recurring subscription candidates), hand those to the LLM,
and ask for 3-5 concrete opportunities with estimated monthly savings.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from supabase import Client

from services.groq_client import chat_json

logger = logging.getLogger(__name__)


REPORT_SYSTEM = """You are a financial coach analyzing a user's real spending.

Given aggregated spending data, produce a savings opportunity report as JSON:

{
  "summary": "1-2 sentence overview of the user's financial picture.",
  "total_monthly_savings": <estimated total monthly savings in currency units>,
  "opportunities": [
    {
      "title": "Short headline",
      "description": "1-2 sentence explanation grounded in the data.",
      "category": "Category name",
      "estimated_monthly_savings": <number>
    }
  ]
}

Rules:
- Produce 3 to 5 opportunities.
- Ground every claim in the provided data. Cite categories or merchants.
- Be realistic — don't suggest cutting essentials by 90%.
- Estimates should sum to roughly "total_monthly_savings".
- No markdown, no prose outside JSON."""


def _aggregate_spending(supabase: Client, user_id: str) -> dict[str, Any]:
    """Pull last-90-day spend and compute useful aggregates."""
    since = (date.today() - timedelta(days=90)).isoformat()

    rows = (
        supabase.table("transactions")
        .select("transaction_date, description, amount, category, currency")
        .eq("user_id", user_id)
        .gte("transaction_date", since)
        .execute()
        .data
        or []
    )

    if not rows:
        return {"empty": True}

    currency = rows[0].get("currency", "USD")
    by_category: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    by_merchant: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    merchant_counts: dict[str, int] = defaultdict(int)
    total_expense = Decimal("0")
    total_income = Decimal("0")

    for r in rows:
        amt = Decimal(str(r["amount"]))
        cat = r.get("category") or "Other"
        desc = r["description"]

        if amt < 0:
            expense = abs(amt)
            by_category[cat] += expense
            total_expense += expense
            # Normalize merchant key — strip trailing numbers/refs
            merchant = desc.strip().upper()[:40]
            by_merchant[merchant] += expense
            merchant_counts[merchant] += 1
        else:
            total_income += amt

    top_categories = sorted(by_category.items(), key=lambda kv: kv[1], reverse=True)[:6]
    top_merchants = sorted(by_merchant.items(), key=lambda kv: kv[1], reverse=True)[:8]
    # Candidates for recurring subscriptions: same merchant, 2+ times
    recurring = [
        {"merchant": m, "times": merchant_counts[m], "total": float(by_merchant[m])}
        for m, _ in top_merchants
        if merchant_counts[m] >= 2
    ][:5]

    return {
        "empty": False,
        "currency": currency,
        "window_days": 90,
        "total_expense": float(total_expense),
        "total_income": float(total_income),
        "top_categories": [{"category": c, "total": float(t)} for c, t in top_categories],
        "top_merchants": [{"merchant": m, "total": float(t)} for m, t in top_merchants],
        "recurring_candidates": recurring,
    }


def generate_savings_report(supabase: Client, user_id: str) -> dict[str, Any]:
    """Compute aggregates + ask LLM for opportunities. Returns a dict ready for JSON response."""
    agg = _aggregate_spending(supabase, user_id)
    if agg.get("empty"):
        return {
            "empty": True,
            "message": "Upload a bank statement to generate your savings report.",
        }

    user_prompt = f"""Here is the user's aggregated spending over the last {agg['window_days']} days.
Currency: {agg['currency']}
Total expenses: {agg['total_expense']}
Total income: {agg['total_income']}

Top categories by spend:
{agg['top_categories']}

Top merchants:
{agg['top_merchants']}

Likely recurring subscriptions:
{agg['recurring_candidates']}

Generate the savings report."""

    try:
        report = chat_json(system=REPORT_SYSTEM, user=user_prompt, max_tokens=2048)
    except Exception as e:
        logger.error("Savings report generation failed: %s", e)
        return {"empty": False, "error": "Could not generate report right now."}

    report["currency"] = agg["currency"]
    report["window_days"] = agg["window_days"]
    return report
