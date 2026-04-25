"""
Bank-statement parsers. CSV via pandas with column auto-detection,
PDF via pdfplumber (tables first, regex line-by-line fallback).

Output is always a ParseResult with a normalized signed-amount convention:
negative = money out, positive = money in.
"""

from __future__ import annotations

import io
import logging
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Iterable, Optional

import pandas as pd
import pdfplumber

from schemas.transactions import ParsedTransaction, ParseResult

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Currency detection
# ---------------------------------------------------------------------------
CURRENCY_SYMBOLS = {
    "₦": "NGN", "NGN": "NGN", "N$": "NGN",
    "$": "USD", "USD": "USD",
    "€": "EUR", "EUR": "EUR",
    "£": "GBP", "GBP": "GBP",
    "¥": "JPY", "JPY": "JPY",
}


def detect_currency(sample_text: str) -> str:
    """Best-effort currency detection. Defaults to USD."""
    for sym, code in CURRENCY_SYMBOLS.items():
        if sym in sample_text:
            return code
    return "USD"


def _clean_amount(raw: str | float | int | None) -> Optional[Decimal]:
    """Coerce a messy amount string into a signed Decimal. Returns None on failure."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return Decimal(str(raw))

    s = str(raw).strip()
    if not s or s.lower() in {"nan", "null", "-", "--"}:
        return None

    # Accounting negatives: (1,234.56) → -1234.56
    negative = False
    if s.startswith("(") and s.endswith(")"):
        negative = True
        s = s[1:-1]

    # Strip currency symbols and thousands separators
    s = re.sub(r"[₦$€£¥]", "", s)
    s = s.replace(",", "").strip()

    if s.startswith("-"):
        negative = True
        s = s[1:].strip()

    try:
        value = Decimal(s)
    except (InvalidOperation, ValueError):
        return None

    return -value if negative else value


def _parse_date(raw) -> Optional[date]:
    """Try a handful of common date formats before giving up."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw

    s = str(raw).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y",
        "%d %b %Y", "%d %B %Y", "%b %d, %Y", "%B %d, %Y",
        "%d/%m/%y", "%m/%d/%y", "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    # Last resort — let pandas try
    try:
        return pd.to_datetime(s, errors="coerce").date()
    except Exception:
        return None


# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------
DATE_COL_HINTS = ("date", "transaction date", "posted", "trans date", "value date")
DESC_COL_HINTS = ("description", "narration", "details", "memo", "particulars", "reference")
AMOUNT_COL_HINTS = ("amount", "value")
DEBIT_COL_HINTS = ("debit", "withdrawal", "paid out", "money out", "dr")
CREDIT_COL_HINTS = ("credit", "deposit", "paid in", "money in", "cr")


def _find_col(columns: Iterable[str], hints: tuple[str, ...]) -> Optional[str]:
    lowered = {c.lower().strip(): c for c in columns}
    for hint in hints:
        for lc, orig in lowered.items():
            if hint in lc:
                return orig
    return None


def parse_csv(file_bytes: bytes) -> ParseResult:
    """Parse a CSV bank statement into normalized transactions."""
    # Read into DataFrame — let pandas sniff the delimiter
    try:
        df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)
    except Exception:
        # Fall back to different encodings
        df = pd.read_csv(
            io.BytesIO(file_bytes), dtype=str, keep_default_na=False, encoding="latin-1"
        )

    if df.empty:
        return ParseResult(transactions=[], currency="USD")

    date_col = _find_col(df.columns, DATE_COL_HINTS)
    desc_col = _find_col(df.columns, DESC_COL_HINTS)
    amount_col = _find_col(df.columns, AMOUNT_COL_HINTS)
    debit_col = _find_col(df.columns, DEBIT_COL_HINTS)
    credit_col = _find_col(df.columns, CREDIT_COL_HINTS)

    if not date_col or not desc_col or not (amount_col or debit_col or credit_col):
        raise ValueError(
            f"CSV missing required columns. Found: {list(df.columns)}. "
            "Need at least one date, description, and amount column."
        )

    # Sample for currency detection
    sample = " ".join(df.head(10).astype(str).values.flatten())
    currency = detect_currency(sample)

    transactions: list[ParsedTransaction] = []

    for _, row in df.iterrows():
        tx_date = _parse_date(row.get(date_col))
        description = str(row.get(desc_col, "")).strip()
        if not tx_date or not description:
            continue

        # Amount: single signed column, or paired debit/credit
        if amount_col:
            amount = _clean_amount(row.get(amount_col))
        else:
            debit = _clean_amount(row.get(debit_col)) if debit_col else None
            credit = _clean_amount(row.get(credit_col)) if credit_col else None
            # Expenses stored as positive in debit col → flip sign
            if debit and debit > 0:
                amount = -debit
            elif credit and credit > 0:
                amount = credit
            else:
                amount = None

        if amount is None:
            continue

        transactions.append(
            ParsedTransaction(
                transaction_date=tx_date,
                description=description,
                amount=amount,
                raw={k: str(v) for k, v in row.items()},
            )
        )

    if not transactions:
        return ParseResult(transactions=[], currency=currency)

    dates = [t.transaction_date for t in transactions]
    return ParseResult(
        transactions=transactions,
        currency=currency,
        period_start=min(dates),
        period_end=max(dates),
    )


# ---------------------------------------------------------------------------
# PDF parsing
# ---------------------------------------------------------------------------
# Regex for "line-style" statements: DATE  DESCRIPTION  AMOUNT  [BALANCE]
# Handles formats like "2024-03-14 GROCERIES PICK-N-PAY -2,450.00"
PDF_LINE_PATTERN = re.compile(
    r"""
    ^\s*
    (?P<date>\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\d{1,2}\s+\w{3,9}\s+\d{2,4})
    \s+
    (?P<desc>.+?)
    \s+
    (?P<amount>[-(]?\s*[₦$€£¥]?\s*[\d,]+\.\d{2}\)?)
    (?:\s+[-(]?\s*[₦$€£¥]?\s*[\d,]+\.\d{2}\)?)?   # optional running balance
    \s*$
    """,
    re.VERBOSE,
)


def parse_pdf(file_bytes: bytes) -> ParseResult:
    """Parse a PDF bank statement. Tries ruled tables, whitespace tables,
    then OPay-specific row regex, then a generic line regex."""
    transactions: list[ParsedTransaction] = []
    all_text = ""

    text_table_settings = {
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "snap_tolerance": 5,
        "intersection_tolerance": 10,
    }

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            all_text += "\n" + page_text

            # Strategy 1: ruled tables
            for table in page.extract_tables() or []:
                if not table or len(table) < 2:
                    continue
                headers = [str(h or "").strip() for h in table[0]]
                if not _find_col(headers, DATE_COL_HINTS):
                    continue
                transactions.extend(_parse_pdf_table(headers, table[1:]))

            # Strategy 2: whitespace-aligned tables
            if not transactions:
                try:
                    tables = page.extract_tables(table_settings=text_table_settings) or []
                except Exception:
                    tables = []
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    headers = [str(h or "").strip() for h in table[0]]
                    if not _find_col(headers, DATE_COL_HINTS):
                        continue
                    transactions.extend(_parse_pdf_table(headers, table[1:]))

    currency = detect_currency(all_text)

    # Strategy 3: OPay-style rows ("DD MMM YYYY HH:MM:SS DD MMM YYYY ... debit credit balance channel ref")
    if not transactions:
        transactions.extend(_parse_opay_text(all_text))

    # Strategy 4: generic line regex
    if not transactions:
        for line in all_text.splitlines():
            m = PDF_LINE_PATTERN.match(line)
            if not m:
                continue
            tx_date = _parse_date(m.group("date"))
            amount = _clean_amount(m.group("amount"))
            description = m.group("desc").strip()
            if tx_date and amount is not None and description:
                transactions.append(
                    ParsedTransaction(
                        transaction_date=tx_date,
                        description=description,
                        amount=amount,
                        raw={"line": line.strip()},
                    )
                )

    logger.info("PDF parse extracted %d transactions", len(transactions))

    if not transactions:
        return ParseResult(transactions=[], currency=currency)

    dates = [t.transaction_date for t in transactions]
    return ParseResult(
        transactions=transactions,
        currency=currency,
        period_start=min(dates),
        period_end=max(dates),
    )


# OPay row: "17 Mar 2026 07:39:57 17 Mar 2026 <description> <debit|--> <credit|--> <balance> <channel> <ref>"
# Description and reference can wrap onto following lines.
_OPAY_ROW_START = re.compile(
    r"^(?P<date>\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s+"
    r"(?P<time>\d{2}:\d{2}:\d{2})\s+"
    r"(?P<vdate>\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s+"
    r"(?P<rest>.+)$"
)
_OPAY_AMOUNTS_TAIL = re.compile(
    r"^(?P<desc>.*?)\s+"
    r"(?P<debit>--|\d{1,3}(?:,\d{3})*\.\d{2})\s+"
    r"(?P<credit>--|\d{1,3}(?:,\d{3})*\.\d{2})\s+"
    r"(?P<balance>\d{1,3}(?:,\d{3})*\.\d{2})\s+"
    r"(?P<channel>Mobile|USSD|WEB|POS|ATM|Web|Branch)\b"
    r"(?:\s+(?P<ref>\S.*))?$"
)


def _parse_opay_text(text: str) -> list[ParsedTransaction]:
    """Detect and parse OPay-style transaction rows from page text."""
    out: list[ParsedTransaction] = []
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    i = 0
    while i < len(lines):
        m = _OPAY_ROW_START.match(lines[i])
        if not m:
            i += 1
            continue

        # Greedily join up to a few following lines until we can match the amounts tail.
        rest = m.group("rest")
        consumed = 1
        tail_match = _OPAY_AMOUNTS_TAIL.match(rest)
        while not tail_match and consumed < 6 and (i + consumed) < len(lines):
            # Stop if the next line is itself a new transaction
            if _OPAY_ROW_START.match(lines[i + consumed]):
                break
            rest = rest + " " + lines[i + consumed]
            consumed += 1
            tail_match = _OPAY_AMOUNTS_TAIL.match(rest)

        if not tail_match:
            i += 1
            continue

        tx_date = _parse_date(m.group("date"))
        if not tx_date:
            i += consumed
            continue

        debit_raw = tail_match.group("debit")
        credit_raw = tail_match.group("credit")
        debit = _clean_amount(debit_raw) if debit_raw != "--" else None
        credit = _clean_amount(credit_raw) if credit_raw != "--" else None

        if debit and debit > 0:
            amount = -debit
        elif credit and credit > 0:
            amount = credit
        else:
            i += consumed
            continue

        description = tail_match.group("desc").strip()
        if not description:
            i += consumed
            continue

        out.append(
            ParsedTransaction(
                transaction_date=tx_date,
                description=description,
                amount=amount,
                raw={
                    "time": m.group("time"),
                    "value_date": m.group("vdate"),
                    "balance": tail_match.group("balance"),
                    "channel": tail_match.group("channel"),
                    "ref": tail_match.group("ref") or "",
                },
            )
        )
        i += consumed

    return out


def _parse_pdf_table(headers: list[str], rows: list[list]) -> list[ParsedTransaction]:
    """Extract transactions from a detected PDF table."""
    date_col = _find_col(headers, DATE_COL_HINTS)
    desc_col = _find_col(headers, DESC_COL_HINTS)
    amount_col = _find_col(headers, AMOUNT_COL_HINTS)
    debit_col = _find_col(headers, DEBIT_COL_HINTS)
    credit_col = _find_col(headers, CREDIT_COL_HINTS)

    if not date_col or not desc_col:
        return []

    date_idx = headers.index(date_col)
    desc_idx = headers.index(desc_col)
    amount_idx = headers.index(amount_col) if amount_col else None
    debit_idx = headers.index(debit_col) if debit_col else None
    credit_idx = headers.index(credit_col) if credit_col else None

    out: list[ParsedTransaction] = []
    for row in rows:
        if not row or all(not c for c in row):
            continue
        tx_date = _parse_date(row[date_idx] if date_idx < len(row) else None)
        description = str(row[desc_idx] or "").strip() if desc_idx < len(row) else ""
        if not tx_date or not description:
            continue

        if amount_idx is not None and amount_idx < len(row):
            amount = _clean_amount(row[amount_idx])
        else:
            debit = _clean_amount(row[debit_idx]) if debit_idx is not None and debit_idx < len(row) else None
            credit = _clean_amount(row[credit_idx]) if credit_idx is not None and credit_idx < len(row) else None
            if debit and debit > 0:
                amount = -debit
            elif credit and credit > 0:
                amount = credit
            else:
                amount = None

        if amount is None:
            continue

        out.append(
            ParsedTransaction(
                transaction_date=tx_date,
                description=description,
                amount=amount,
                raw={"row": [str(c) for c in row]},
            )
        )
    return out


# ---------------------------------------------------------------------------
# Unified entrypoint
# ---------------------------------------------------------------------------
def parse_statement(file_bytes: bytes, content_type: str, filename: str) -> ParseResult:
    """Dispatch to CSV or PDF parser based on content type / extension."""
    lower_name = filename.lower()
    if content_type == "application/pdf" or lower_name.endswith(".pdf"):
        return parse_pdf(file_bytes)
    if (
        content_type in ("text/csv", "application/vnd.ms-excel", "text/plain")
        or lower_name.endswith(".csv")
    ):
        return parse_csv(file_bytes)
    raise ValueError(f"Unsupported file type: {content_type} / {filename}")
