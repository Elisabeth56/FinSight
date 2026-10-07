"""Chat over the user's own transactions.

1. A small model turns the question into filters (dates, category, merchant, direction).
2. SQL computes the exact totals and fetches the matching rows.
3. The large model writes the answer from those numbers and is told not to do any maths.
No vector store: for transactions, exact filters beat similarity search and cost nothing.
"""

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import date
from typing import Literal

from psycopg import sql
from pydantic import BaseModel

from app.ai.llm import fenced, generate_json, load_prompt, stream
from app.db import connect, one
from app.errors import AppError
from app.features.statements.categorize import Category
from app.features.statements.schemas import CATEGORIES

SYMBOLS = {"NGN": "₦", "USD": "$", "GBP": "£", "EUR": "€"}
ROW_LIMIT = 40


class Intent(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    category: Category | None = None
    merchant: str | None = None
    direction: Literal["in", "out"] | None = None


@dataclass
class Facts:
    """What SQL found; also sent to the UI as the answer's sources."""

    currency: str
    count: int
    total_minor: int
    start: date | None
    end: date | None
    categories: list[dict]
    merchants: list[dict]
    rows: list[dict]

    def sources(self) -> dict:
        return {
            "count": self.count,
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
            "categories": [c["category"] for c in self.categories[:3]],
        }


def money(minor: int, currency: str) -> str:
    return f"{SYMBOLS.get(currency, currency + ' ')}{abs(minor) / 100:,.0f}"


def extract_intent(question: str, latest: date) -> Intent:
    """Small model; if it fails, search everything rather than fail the question."""
    try:
        return generate_json(
            system=load_prompt("chat_intent")
            .replace("{latest}", latest.isoformat())
            .replace("{categories}", ", ".join(CATEGORIES)),
            user=fenced("question", question),
            schema=Intent,
            size="small",
            max_tokens=200,
            name="chat_intent",
        )
    except AppError:
        return Intent()


def latest_date(user_id: str) -> date | None:
    with connect() as conn:
        return one(
            conn.execute(
                "select max(transaction_date) as d from transactions where user_id = %s",
                (user_id,),
            ).fetchone()
        )["d"]


def gather(user_id: str, currency: str, intent: Intent) -> Facts:
    """Runs the intent as SQL: exact totals, top categories and names, recent rows."""
    where = [sql.SQL("user_id = %s"), sql.SQL("currency = %s")]
    params: list = [user_id, currency]
    if intent.start_date:
        where.append(sql.SQL("transaction_date >= %s"))
        params.append(intent.start_date)
    if intent.end_date:
        where.append(sql.SQL("transaction_date <= %s"))
        params.append(intent.end_date)
    if intent.category:
        where.append(sql.SQL("category = %s"))
        params.append(intent.category)
    if intent.merchant:
        where.append(sql.SQL("(description ilike %s or merchant ilike %s)"))
        params += [f"%{intent.merchant}%"] * 2
    if intent.direction == "out":
        where.append(sql.SQL("amount_minor < 0"))
    elif intent.direction == "in":
        where.append(sql.SQL("amount_minor > 0"))
    clause = sql.SQL(" and ").join(where)

    with connect() as conn:
        totals = one(
            conn.execute(
                sql.SQL(
                    "select count(*) as n, coalesce(sum(amount_minor), 0) as total,"
                    " min(transaction_date) as first, max(transaction_date) as last"
                    " from transactions where {}"
                ).format(clause),
                params,
            ).fetchone()
        )
        categories = conn.execute(
            sql.SQL(
                "select category, sum(amount_minor) as total, count(*) as n from transactions"
                " where {} group by category order by abs(sum(amount_minor)) desc"
            ).format(clause),
            params,
        ).fetchall()
        merchants = conn.execute(
            sql.SQL(
                "select coalesce(merchant, description) as name, sum(amount_minor) as total,"
                " count(*) as n from transactions where {} group by 1"
                " order by abs(sum(amount_minor)) desc limit 5"
            ).format(clause),
            params,
        ).fetchall()
        rows = conn.execute(
            sql.SQL(
                "select transaction_date, coalesce(merchant, description) as name, amount_minor,"
                " category, is_anomaly from transactions where {}"
                " order by transaction_date desc limit %s"
            ).format(clause),
            [*params, ROW_LIMIT],
        ).fetchall()

    return Facts(
        currency=currency,
        count=totals["n"],
        total_minor=totals["total"],
        start=intent.start_date or totals["first"],
        end=intent.end_date or totals["last"],
        categories=categories,
        merchants=merchants,
        rows=rows,
    )


def describe(facts: Facts, intent: Intent) -> str:
    """The <facts> and <rows> blocks the answer model reads. Every number here comes from SQL."""
    if facts.count == 0:
        return fenced("facts", "Nothing matched this question in the person's transactions.")
    cur = facts.currency
    kind = {"out": "spent", "in": "received"}.get(intent.direction or "", "net total")
    by_category = "; ".join(
        f"{c['category']} {money(c['total'], cur)} ({c['n']})" for c in facts.categories
    )
    by_name = "; ".join(f"{m['name']} {money(m['total'], cur)} ({m['n']})" for m in facts.merchants)
    lines = [
        f"Period: {facts.start} to {facts.end}",
        f"Matching transactions: {facts.count}",
        f"Total {kind}: {money(facts.total_minor, cur)}",
        f"By category: {by_category}",
        f"Top names: {by_name}",
    ]
    rows = "\n".join(
        " | ".join(
            [
                str(r["transaction_date"]),
                r["name"],
                ("-" if r["amount_minor"] < 0 else "+") + money(r["amount_minor"], cur),
                r["category"] + (" (unusual)" if r["is_anomaly"] else ""),
            ]
        )
        for r in facts.rows
    )
    return fenced("facts", "\n".join(lines)) + "\n\n" + fenced("rows", rows)


async def answer(user_id: str, question: str, currency: str) -> tuple[Facts, AsyncIterator[str]]:
    """Returns the facts behind the answer and a stream of the answer's text."""
    # blocking steps run in a thread so other requests keep moving
    latest = await asyncio.to_thread(latest_date, user_id) or date.today()
    intent = await asyncio.to_thread(extract_intent, question, latest)
    facts = await asyncio.to_thread(gather, user_id, currency, intent)

    prompt = f"{fenced('question', question)}\n\n{describe(facts, intent)}"
    tokens = stream(
        system=load_prompt("chat_answer"), user=prompt, size="large", name="chat_answer"
    )
    return facts, tokens
