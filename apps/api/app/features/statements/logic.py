"""Statement upload: parse → categorize → flag anomalies → store. Also list and delete."""

import hashlib
import logging
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from psycopg.types.json import Jsonb

from app.auth import User
from app.config import settings
from app.db import connect, one
from app.errors import AppError
from app.features.statements.anomaly import detect_anomalies
from app.features.statements.categorize import categorize_all
from app.features.statements.parser import parse_statement
from app.features.statements.schemas import StatementOut

logger = logging.getLogger(__name__)


def to_minor(amount: Decimal) -> int:
    """Naira (or dollars) to kobo (or cents), rounded half up."""
    return int((amount * 100).quantize(Decimal("1")))


def uploads_this_month(user_id: str) -> int:
    month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    with connect() as conn:
        row = one(
            conn.execute(
                "select count(*) as n from statements where user_id = %s and created_at >= %s",
                (user_id, month_start),
            ).fetchone()
        )
    return row["n"]


def upload_statement(user: User, contents: bytes, filename: str, content_type: str) -> StatementOut:
    """Runs the whole pipeline. Nothing is stored unless every step succeeds."""
    # validate
    if not contents:
        raise AppError(400, "empty_file", "That file is empty.")
    if len(contents) > settings.max_upload_bytes:
        raise AppError(413, "file_too_large", "Statements can be up to 4 MB. Try a shorter period.")
    if not user.is_pro and uploads_this_month(user.id) >= settings.free_uploads_per_month:
        raise AppError(
            402,
            "upload_quota_reached",
            "You've used this month's free upload. Pro gives you unlimited uploads.",
        )

    sha256 = hashlib.sha256(contents).hexdigest()
    with connect() as conn:
        seen = conn.execute(
            "select 1 from statements where user_id = %s and file_sha256 = %s",
            (user.id, sha256),
        ).fetchone()
    if seen:
        raise AppError(409, "already_uploaded", "You've already uploaded this statement.")

    # parse
    try:
        parsed = parse_statement(contents, content_type, filename)
    except ValueError as e:
        raise AppError(422, "unsupported_file", str(e)) from e
    except Exception as e:
        logger.exception("Parse failed")
        raise AppError(
            422, "unreadable_file", "We couldn't read this file. Try the CSV export instead."
        ) from e
    if not parsed.transactions:
        raise AppError(
            422,
            "no_transactions",
            "We couldn't find any transactions. If this PDF is a scan, try the CSV export.",
        )

    # categorize and flag against the last 90 days of the same user's spending
    labels = categorize_all(parsed.transactions)
    categories = [label.category for label in labels]
    flags = detect_anomalies(parsed.transactions, categories, _history(user.id))

    # store statement and rows together
    file_type = "pdf" if filename.lower().endswith(".pdf") else "csv"
    with connect() as conn, conn.transaction():
        statement = one(
            conn.execute(
                "insert into statements (user_id, filename, file_type, file_sha256, status,"
                " currency, period_start, period_end, row_count)"
                " values (%s, %s, %s, %s, 'ready', %s, %s, %s, %s)"
                " returning id::text, filename, currency, period_start, period_end, row_count",
                (
                    user.id,
                    filename,
                    file_type,
                    sha256,
                    parsed.currency,
                    parsed.period_start,
                    parsed.period_end,
                    len(parsed.transactions),
                ),
            ).fetchone()
        )
        with conn.cursor() as cur:
            cur.executemany(
                "insert into transactions (user_id, statement_id, transaction_date, description,"
                " merchant, amount_minor, currency, category, category_source, is_anomaly, raw)"
                " values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                [
                    (
                        user.id,
                        statement["id"],
                        t.transaction_date,
                        t.description,
                        label.merchant,
                        to_minor(t.amount),
                        parsed.currency,
                        label.category,
                        label.source,
                        flag,
                        Jsonb(t.raw),
                    )
                    for t, label, flag in zip(parsed.transactions, labels, flags, strict=True)
                ],
            )
    return StatementOut(**statement, anomaly_count=sum(flags))


def _history(user_id: str) -> list[tuple[str, Decimal, date]]:
    since = date.today() - timedelta(days=90)
    with connect() as conn:
        rows = conn.execute(
            "select category, amount_minor, transaction_date from transactions"
            " where user_id = %s and transaction_date >= %s",
            (user_id, since),
        ).fetchall()
    return [(r["category"], Decimal(r["amount_minor"]) / 100, r["transaction_date"]) for r in rows]


def list_statements(user_id: str) -> list[StatementOut]:
    with connect() as conn:
        rows = conn.execute(
            "select s.id::text, s.filename, s.currency, s.period_start, s.period_end, s.row_count,"
            " count(t.id) filter (where t.is_anomaly) as anomaly_count"
            " from statements s left join transactions t on t.statement_id = s.id"
            " where s.user_id = %s group by s.id order by s.created_at desc",
            (user_id,),
        ).fetchall()
    return [StatementOut(**r) for r in rows]


def delete_statement(user_id: str, statement_id: str) -> None:
    """Deletes the statement and, by cascade, every row read from it."""
    with connect() as conn:
        deleted = conn.execute(
            "delete from statements where id = %s and user_id = %s returning id",
            (statement_id, user_id),
        ).fetchone()
    if not deleted:
        raise AppError(404, "statement_not_found", "That statement no longer exists.")
