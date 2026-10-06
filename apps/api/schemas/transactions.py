"""Transaction-related schemas. Shared across parser, categorizer, and routes."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

# 12 fixed categories. Keep the list tight — the LLM is more accurate
# when it picks from a small, well-defined set.
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
    """Raw transaction after parsing, before categorization."""

    transaction_date: date
    description: str
    amount: Decimal  # signed: negative = expense, positive = income
    raw: dict = Field(default_factory=dict)


class ParseResult(BaseModel):
    """Output of the parser service."""

    transactions: list[ParsedTransaction]
    currency: str  # 'NGN', 'USD', etc.
    period_start: date | None = None
    period_end: date | None = None


class Transaction(BaseModel):
    """Transaction as stored in DB and returned to the frontend."""

    id: str
    user_id: str
    statement_id: str
    transaction_date: date
    description: str
    amount: Decimal
    currency: str
    category: str | None = None
    category_source: str | None = None
    is_anomaly: bool = False
    created_at: datetime | None = None


class UploadResult(BaseModel):
    """Response from POST /upload."""

    statement_id: str
    filename: str
    currency: str
    period_start: date | None
    period_end: date | None
    transaction_count: int
    anomaly_count: int


class MonthlyPoint(BaseModel):
    month: str  # 'YYYY-MM'
    total_spent: float
    total_income: float


class CategoryPoint(BaseModel):
    category: str
    total: float
    count: int


class AnalyticsSummary(BaseModel):
    currency: str
    monthly: list[MonthlyPoint]
    by_category: list[CategoryPoint]
    anomaly_count: int
    total_transactions: int
