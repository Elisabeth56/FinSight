"""
Chat service — RAG over the user's own transactions.

Retrieval strategy: we don't use a vector store. For transaction data,
exact filters (date range, category, keyword) give better answers than
semantic similarity and cost nothing. We ask the LLM to extract filter
intent, then run targeted SQL against Supabase, then stream a natural-
language answer with the retrieved rows as context.

Two LLM calls per user message:
1. Intent extraction (JSON, non-streaming, fast)
2. Answer generation (streaming)
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import AsyncIterator, Optional

from pydantic import BaseModel, Field
from supabase import Client

from schemas.transactions import CATEGORIES
from services.groq_client import chat_json, chat_stream

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Intent extraction
# ---------------------------------------------------------------------------
class QueryIntent(BaseModel):
    start_date: Optional[str] = None   # 'YYYY-MM-DD'
    end_date: Optional[str] = None
    category: Optional[str] = None
    keyword: Optional[str] = None
    limit: int = Field(default=100, ge=10, le=500)


INTENT_SYSTEM = f"""Extract filter parameters from a user's question about their finances.

Today is {{today}}. Return a JSON object with these optional keys:
- "start_date": ISO date (YYYY-MM-DD) if the question is scoped to a period
- "end_date": ISO date if scoped to a period
- "category": one of {CATEGORIES} if the question names a category
- "keyword": a merchant or description term to search for
- "limit": how many rows are likely needed (default 100)

Resolve relative dates:
- "last month" → the previous full calendar month
- "this month" → the current month to date
- "March" → March of the current year (or previous if future)
- "last 3 months" → 90 days back from today

Return ONLY the JSON object. Omit keys you can't determine."""


def _extract_intent(message: str) -> QueryIntent:
    try:
        raw = chat_json(
            system=INTENT_SYSTEM.format(today=date.today().isoformat()),
            user=message,
            max_tokens=256,
        )
        return QueryIntent(**{k: v for k, v in raw.items() if v is not None})
    except Exception as e:
        logger.warning("Intent extraction failed, falling back to broad search: %s", e)
        return QueryIntent()


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------
def _fetch_transactions(
    supabase: Client,
    user_id: str,
    intent: QueryIntent,
) -> list[dict]:
    q = (
        supabase.table("transactions")
        .select("transaction_date, description, amount, category, is_anomaly")
        .eq("user_id", user_id)
    )
    if intent.start_date:
        q = q.gte("transaction_date", intent.start_date)
    if intent.end_date:
        q = q.lte("transaction_date", intent.end_date)
    if intent.category:
        q = q.eq("category", intent.category)
    if intent.keyword:
        q = q.ilike("description", f"%{intent.keyword}%")

    q = q.order("transaction_date", desc=True).limit(intent.limit)
    return q.execute().data or []


# ---------------------------------------------------------------------------
# Answer generation
# ---------------------------------------------------------------------------
ANSWER_SYSTEM = """You are FinSight, a friendly and precise personal-finance assistant.

You answer questions about the user's own transactions, which are provided
as structured data in each message. Rules:

- Be concise. Lead with the direct answer, then add one or two supporting
  details if relevant.
- Always cite specific amounts and dates when they appear in the data.
- If the data is empty, say so clearly and suggest uploading a statement
  or broadening the question.
- Format currency with the user's currency code (provided per message).
- Never invent transactions not present in the context.
- When summarizing spending, group by category if useful."""


def _format_context(transactions: list[dict], currency: str) -> str:
    if not transactions:
        return "(No matching transactions found.)"

    lines = [f"Currency: {currency}", f"Found {len(transactions)} transactions:\n"]
    for t in transactions:
        flag = " ⚠ANOMALY" if t.get("is_anomaly") else ""
        lines.append(
            f"- {t['transaction_date']} | {t.get('category') or 'Uncategorized'} "
            f"| {t['amount']} | {t['description']}{flag}"
        )
    return "\n".join(lines)


async def stream_chat(
    supabase: Client,
    user_id: str,
    message: str,
    currency: str = "USD",
) -> AsyncIterator[str]:
    """Full pipeline: intent → fetch → stream answer."""
    intent = _extract_intent(message)
    logger.info("Chat intent: %s", intent.model_dump(exclude_none=True))

    transactions = _fetch_transactions(supabase, user_id, intent)
    context = _format_context(transactions, currency)

    user_prompt = f"""User question: {message}

Relevant transactions from their data:
{context}

Answer the question using only this data."""

    async for token in chat_stream(system=ANSWER_SYSTEM, user=user_prompt):
        yield token
