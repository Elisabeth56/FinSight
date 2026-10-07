"""Categorization: one LLM call per batch of *unique* descriptions, mapped back to every row.

Nigerian statements repeat the same narration constantly (Bolt rides, airtime, POS at the same
shop), so deduplicating first cuts calls by roughly two thirds and keeps a large statement inside
Groq's free per-minute token limit.
"""

import logging
import re
from collections.abc import Iterable
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.ai.llm import fenced, generate_json, load_prompt
from app.errors import AppError
from app.features.statements.schemas import CATEGORIES, ParsedTransaction

logger = logging.getLogger(__name__)

BATCH_SIZE = 40

Category = Literal[
    "Food & Dining",
    "Groceries",
    "Transport",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Health",
    "Travel",
    "Education",
    "Transfers",
    "Income",
    "Other",
]


class Item(BaseModel):
    i: int
    category: Category
    merchant: str = Field(max_length=80)

    @field_validator("merchant")
    @classmethod
    def tidy(cls, value: str) -> str:
        return value.strip()[:40]


class Batch(BaseModel):
    items: list[Item]


class Categorized(BaseModel):
    category: str
    merchant: str | None
    source: Literal["llm", "fallback"]


FALLBACK = Categorized(category="Other", merchant=None, source="fallback")


def normalize(description: str) -> str:
    """Key for deduplication: drops reference numbers and spacing so repeats collapse together."""
    key = re.sub(r"\d{4,}", "", description.upper())
    return re.sub(r"[\s/*]+", " ", key).strip()


def categorize_all(transactions: Iterable[ParsedTransaction]) -> list[Categorized]:
    """Returns one result per transaction, in order. Falls back to Other if the AI is down."""
    txs = list(transactions)

    # dedupe: direction is part of the key, so a refund and a purchase stay separate
    uniques: dict[tuple[str, bool], ParsedTransaction] = {}
    for t in txs:
        uniques.setdefault((normalize(t.description), t.amount > 0), t)
    keys = list(uniques)

    results: dict[tuple[str, bool], Categorized] = {}
    for start in range(0, len(keys), BATCH_SIZE):
        batch = keys[start : start + BATCH_SIZE]
        try:
            results.update(_categorize_batch(batch, [uniques[k] for k in batch]))
        except AppError as e:
            logger.warning("categorization batch fell back to Other: %s", e.code)

    logger.info("categorized %d rows via %d unique descriptions", len(txs), len(keys))
    return [results.get((normalize(t.description), t.amount > 0), FALLBACK) for t in txs]


def _categorize_batch(
    keys: list[tuple[str, bool]], samples: list[ParsedTransaction]
) -> dict[tuple[str, bool], Categorized]:
    lines = "\n".join(
        f"{n}. [{'IN' if t.amount > 0 else 'OUT'}] {t.description}"
        for n, t in enumerate(samples, start=1)
    )
    batch = generate_json(
        system=load_prompt("categorize").replace("{categories}", ", ".join(CATEGORIES)),
        user=fenced("transactions", lines),
        schema=Batch,
        size="large",
        name="categorize",
    )
    by_number = {item.i: item for item in batch.items}
    return {
        key: Categorized(category=item.category, merchant=item.merchant or None, source="llm")
        for n, key in enumerate(keys, start=1)
        if (item := by_number.get(n))
    }
