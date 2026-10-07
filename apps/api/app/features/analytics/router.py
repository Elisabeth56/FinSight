"""GET /analytics/summary: one month's figures and the months before it, all summed in SQL.

Totals are kept per currency so naira and dollars are never added together. The window
ends at the user's latest transaction month, not today, so older statements still show.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.auth import CurrentUser
from app.db import connect, one
from app.features.transactions.router import month_bounds

router = APIRouter(prefix="/analytics", tags=["analytics"])


class MonthPoint(BaseModel):
    month: str
    spent_minor: int
    income_minor: int


class CategoryPoint(BaseModel):
    category: str
    total_minor: int
    count: int


class Summary(BaseModel):
    currency: str | None
    currencies: list[str]
    month: str | None
    spent_minor: int
    income_minor: int
    previous_spent_minor: int | None
    by_category: list[CategoryPoint]
    monthly: list[MonthPoint]
    anomaly_count: int
    transaction_count: int


EMPTY = Summary(
    currency=None,
    currencies=[],
    month=None,
    spent_minor=0,
    income_minor=0,
    previous_spent_minor=None,
    by_category=[],
    monthly=[],
    anomaly_count=0,
    transaction_count=0,
)


@router.get("/summary", response_model=Summary)
def summary(
    user: CurrentUser,
    month: str | None = Query(None, description="YYYY-MM; defaults to the latest month"),
    currency: str | None = Query(None, min_length=3, max_length=3),
    months: int = Query(6, ge=1, le=24),
) -> Summary:
    with connect() as conn:
        # currencies ordered by how much of the user's data they cover
        currencies = [
            r["currency"].strip()
            for r in conn.execute(
                "select currency, count(*) from transactions where user_id = %s"
                " group by currency order by count(*) desc",
                (user.id,),
            ).fetchall()
        ]
        if not currencies:
            return EMPTY
        cur = currency.upper() if currency and currency.upper() in currencies else currencies[0]

        if month:
            start, end = month_bounds(month)
        else:
            latest = one(
                conn.execute(
                    "select max(transaction_date) as d from transactions"
                    " where user_id = %s and currency = %s",
                    (user.id, cur),
                ).fetchone()
            )["d"]
            start, end = month_bounds(latest.strftime("%Y-%m"))

        monthly = conn.execute(
            "select to_char(date_trunc('month', transaction_date), 'YYYY-MM') as month,"
            " coalesce(sum(-amount_minor) filter (where amount_minor < 0), 0) as spent_minor,"
            " coalesce(sum(amount_minor) filter (where amount_minor > 0), 0) as income_minor"
            " from transactions"
            " where user_id = %s and currency = %s and transaction_date < %s"
            " and transaction_date >= (%s::date - make_interval(months => %s))"
            " group by 1 order by 1",
            (user.id, cur, end, start, months - 1),
        ).fetchall()

        by_category = conn.execute(
            "select category, sum(-amount_minor) as total_minor, count(*) as count"
            " from transactions"
            " where user_id = %s and currency = %s and amount_minor < 0"
            " and transaction_date >= %s and transaction_date < %s"
            " group by category order by total_minor desc",
            (user.id, cur, start, end),
        ).fetchall()

        counts = one(
            conn.execute(
                "select count(*) filter (where is_anomaly and transaction_date >= %s"
                " and transaction_date < %s) as anomalies, count(*) as total"
                " from transactions where user_id = %s and currency = %s",
                (start, end, user.id, cur),
            ).fetchone()
        )

    month_key = start.strftime("%Y-%m")
    by_month = {m["month"]: m for m in monthly}
    this = by_month.get(month_key, {"spent_minor": 0, "income_minor": 0})
    previous = monthly[-2] if len(monthly) >= 2 and monthly[-1]["month"] == month_key else None

    return Summary(
        currency=cur,
        currencies=currencies,
        month=month_key,
        spent_minor=this["spent_minor"],
        income_minor=this["income_minor"],
        previous_spent_minor=previous["spent_minor"] if previous else None,
        by_category=[CategoryPoint(**c) for c in by_category],
        monthly=[MonthPoint(**m) for m in monthly],
        anomaly_count=counts["anomalies"],
        transaction_count=counts["total"],
    )
