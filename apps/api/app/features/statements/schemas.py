"""Shapes shared by the parser, categorizer and statements endpoints."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

# The LLM is more accurate picking from a small, well-defined set. Mirrors the CHECK in the schema.
CATEGORIES = [
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


class ParsedTransaction(BaseModel):
    """A row read from a statement, before categorization."""

    transaction_date: date
    description: str
    amount: Decimal  # signed: negative = money out, positive = money in
    raw: dict = Field(default_factory=dict)


class ParseResult(BaseModel):
    transactions: list[ParsedTransaction]
    currency: str
    period_start: date | None = None
    period_end: date | None = None


class StatementOut(BaseModel):
    id: str
    filename: str
    currency: str
    period_start: date | None
    period_end: date | None
    row_count: int
    anomaly_count: int = 0
