"""
LLM-only categorization. Batches transactions to LLaMA 3 via Groq
with JSON mode for structured output.

Tuning notes:
- Batch size 40 balances context length vs API calls.
- We only send description + amount sign (income/expense), not the full
  amount value, so prompts stay compact.
- Temperature 0 for deterministic output.
"""

from __future__ import annotations

import logging
from typing import Iterable

from schemas.transactions import CATEGORIES, ParsedTransaction
from services.groq_client import chat_json

logger = logging.getLogger(__name__)

BATCH_SIZE = 40

SYSTEM_PROMPT = f"""You are a financial transaction categorizer.

Given a list of bank transactions, assign each one to exactly ONE category from this list:
{", ".join(CATEGORIES)}.

Rules:
- "Income" is for incoming money (salary, refunds, reimbursements).
- "Transfers" is for moving money between your own accounts.
- "Bills & Utilities" covers rent, electricity, internet, phone, streaming subscriptions.
- "Food & Dining" is restaurants, cafes, takeout. "Groceries" is supermarkets.
- Use "Other" only when genuinely ambiguous.

Return ONLY a JSON object with this exact shape:
{{"categories": ["Category1", "Category2", ...]}}

The array length MUST match the number of transactions in order."""


def _build_user_prompt(transactions: list[ParsedTransaction]) -> str:
    lines = []
    for i, t in enumerate(transactions):
        direction = "INCOME" if t.amount > 0 else "EXPENSE"
        lines.append(f"{i+1}. [{direction}] {t.description}")
    return "Categorize these transactions:\n\n" + "\n".join(lines)


def _validate_category(raw: str) -> str:
    """Coerce any odd LLM output back to a valid category."""
    if raw in CATEGORIES:
        return raw
    # Case-insensitive fallback
    for c in CATEGORIES:
        if c.lower() == raw.lower().strip():
            return c
    logger.warning("LLM returned unknown category '%s' — defaulting to Other", raw)
    return "Other"


def categorize_batch(transactions: list[ParsedTransaction]) -> list[str]:
    """Categorize a single batch. Returns a list of category strings."""
    if not transactions:
        return []

    try:
        result = chat_json(
            system=SYSTEM_PROMPT,
            user=_build_user_prompt(transactions),
        )
        raw_categories = result.get("categories", [])
    except Exception as e:
        logger.error("Groq categorization failed: %s", e)
        return ["Other"] * len(transactions)

    # Pad/truncate to match input length — LLM sometimes returns wrong count
    categories = [_validate_category(c) for c in raw_categories[: len(transactions)]]
    while len(categories) < len(transactions):
        categories.append("Other")
    return categories


def categorize_all(transactions: Iterable[ParsedTransaction]) -> list[str]:
    """Categorize any number of transactions, batching automatically."""
    txs = list(transactions)
    out: list[str] = []
    for i in range(0, len(txs), BATCH_SIZE):
        batch = txs[i : i + BATCH_SIZE]
        out.extend(categorize_batch(batch))
    return out
