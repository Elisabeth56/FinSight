"""Transaction list + analytics summary routes."""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query

from core.auth import get_current_user
from db.supabase import get_supabase_user
from schemas.auth import CurrentUser
from schemas.transactions import AnalyticsSummary, CategoryPoint, MonthlyPoint

router = APIRouter(tags=["transactions"])


@router.get("/transactions")
async def list_transactions(
    user: CurrentUser = Depends(get_current_user),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    sb = get_supabase_user(user.access_token)
    q = (
        sb.table("transactions")
        .select(
            "id, transaction_date, description, amount, currency, category, is_anomaly",
            count="exact",
        )
        .eq("user_id", user.id)
    )
    if month:
        # month='YYYY-MM' → filter [YYYY-MM-01, next-month-01)
        y, m = month.split("-")
        y, m = int(y), int(m)
        start = f"{y:04d}-{m:02d}-01"
        end_y, end_m = (y, m + 1) if m < 12 else (y + 1, 1)
        end = f"{end_y:04d}-{end_m:02d}-01"
        q = q.gte("transaction_date", start).lt("transaction_date", end)
    if category:
        q = q.eq("category", category)
    if search:
        q = q.ilike("description", f"%{search}%")

    result = (
        q.order("transaction_date", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {
        "transactions": result.data or [],
        "total": result.count or 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/analytics/summary", response_model=AnalyticsSummary)
async def analytics_summary(
    user: CurrentUser = Depends(get_current_user),
    months: int = Query(6, ge=1, le=24),
):
    sb = get_supabase_user(user.access_token)
    rows = (
        sb.table("transactions")
        .select("transaction_date, amount, currency, category, is_anomaly")
        .eq("user_id", user.id)
        .order("transaction_date", desc=True)
        .execute()
        .data
        or []
    )

    if not rows:
        return AnalyticsSummary(
            currency="USD",
            monthly=[],
            by_category=[],
            anomaly_count=0,
            total_transactions=0,
        )

    currency = rows[0].get("currency", "USD")

    # Monthly totals
    monthly_spent: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    monthly_income: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for r in rows:
        ym = r["transaction_date"][:7]  # 'YYYY-MM'
        amt = Decimal(str(r["amount"]))
        if amt < 0:
            monthly_spent[ym] += abs(amt)
        else:
            monthly_income[ym] += amt

    all_months = sorted(set(monthly_spent) | set(monthly_income), reverse=True)[:months]
    all_months = sorted(all_months)  # chronological for charts

    monthly = [
        MonthlyPoint(
            month=m,
            total_spent=float(monthly_spent[m]),
            total_income=float(monthly_income[m]),
        )
        for m in all_months
    ]

    # Category breakdown (expenses only, over the visible window)
    window_start = all_months[0] + "-01" if all_months else None
    cat_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    cat_counts: dict[str, int] = defaultdict(int)
    for r in rows:
        if window_start and r["transaction_date"] < window_start:
            continue
        amt = Decimal(str(r["amount"]))
        if amt >= 0:
            continue
        cat = r.get("category") or "Other"
        cat_totals[cat] += abs(amt)
        cat_counts[cat] += 1

    by_category = sorted(
        [
            CategoryPoint(category=c, total=float(t), count=cat_counts[c])
            for c, t in cat_totals.items()
        ],
        key=lambda x: x.total,
        reverse=True,
    )

    anomaly_count = sum(1 for r in rows if r.get("is_anomaly"))
    return AnalyticsSummary(
        currency=currency,
        monthly=monthly,
        by_category=by_category,
        anomaly_count=anomaly_count,
        total_transactions=len(rows),
    )
