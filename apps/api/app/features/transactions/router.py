"""GET /transactions: the signed-in user's rows, filtered and paged in SQL."""

from datetime import date

from fastapi import APIRouter, Query
from psycopg import sql
from pydantic import BaseModel

from app.auth import CurrentUser
from app.db import connect
from app.errors import AppError

router = APIRouter(tags=["transactions"])


class TransactionOut(BaseModel):
    id: str
    transaction_date: date
    description: str
    merchant: str | None
    amount_minor: int
    currency: str
    category: str
    is_anomaly: bool


class TransactionPage(BaseModel):
    transactions: list[TransactionOut]
    total: int
    limit: int
    offset: int


def month_bounds(month: str) -> tuple[date, date]:
    """'2026-03' → (2026-03-01, 2026-04-01)."""
    try:
        start = date.fromisoformat(f"{month}-01")
    except ValueError:
        raise AppError(422, "invalid_month", "Month must look like 2026-03.") from None
    end = date(start.year + start.month // 12, start.month % 12 + 1, 1)
    return start, end


@router.get("/transactions", response_model=TransactionPage)
def list_transactions(
    user: CurrentUser,
    month: str | None = Query(None, description="YYYY-MM"),
    category: str | None = None,
    search: str | None = Query(None, max_length=80),
    flagged: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> TransactionPage:
    # build the filter list; every query starts from the caller's own rows
    where, params = [sql.SQL("user_id = %s")], [user.id]
    if month:
        start, end = month_bounds(month)
        where.append(sql.SQL("transaction_date >= %s and transaction_date < %s"))
        params += [start, end]
    if category:
        where.append(sql.SQL("category = %s"))
        params.append(category)
    if search:
        where.append(sql.SQL("(description ilike %s or merchant ilike %s)"))
        params += [f"%{search}%", f"%{search}%"]
    if flagged:
        where.append(sql.SQL("is_anomaly"))

    with connect() as conn:
        query = sql.SQL(
            "select id::text, transaction_date, description, merchant, amount_minor, currency,"
            " category, is_anomaly, count(*) over () as total"
            " from transactions where {}"
            " order by transaction_date desc, created_at desc limit %s offset %s"
        ).format(sql.SQL(" and ").join(where))
        rows = conn.execute(
            query,
            (*params, limit, offset),
        ).fetchall()

    total = rows[0]["total"] if rows else 0
    return TransactionPage(
        transactions=[TransactionOut(**{k: v for k, v in r.items() if k != "total"}) for r in rows],
        total=total,
        limit=limit,
        offset=offset,
    )
