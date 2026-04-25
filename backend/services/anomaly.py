"""
Per-category anomaly detection.

Strategy: for each expense transaction, compare its amount against the
mean + std of same-category expenses from the preceding 90 days.
Flag as anomaly if z-score > 2.5 AND the amount is in the top 10% for
that category (avoids flagging every small purchase as unusual when the
category has very low variance).

Runs in-memory over the newly-parsed batch + historical rows. Simple,
fast, and doesn't need a background job.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from statistics import mean, pstdev
from typing import Sequence

from schemas.transactions import ParsedTransaction


Z_THRESHOLD = 2.5
MIN_SAMPLES = 5  # don't flag without enough history


def detect_anomalies(
    new_transactions: Sequence[ParsedTransaction],
    categories: Sequence[str],
    historical: Sequence[tuple[str, Decimal, date]] | None = None,
) -> list[bool]:
    """
    For each new transaction, return True if it's a spending anomaly.

    Args:
        new_transactions: the just-parsed batch
        categories: parallel list of category assignments for new_transactions
        historical: optional list of (category, amount, date) tuples from DB
    """
    historical = historical or []

    # Bucket all expense amounts by category
    buckets: dict[str, list[float]] = defaultdict(list)
    for cat, amt, _ in historical:
        if amt < 0:
            buckets[cat].append(float(abs(amt)))
    for tx, cat in zip(new_transactions, categories):
        if tx.amount < 0:
            buckets[cat].append(float(abs(tx.amount)))

    # Pre-compute stats per category
    stats: dict[str, tuple[float, float, float]] = {}  # cat -> (mean, std, p90)
    for cat, amounts in buckets.items():
        if len(amounts) < MIN_SAMPLES:
            continue
        mu = mean(amounts)
        sigma = pstdev(amounts) or 1.0  # avoid div-by-zero
        p90 = sorted(amounts)[int(len(amounts) * 0.9)]
        stats[cat] = (mu, sigma, p90)

    flags: list[bool] = []
    for tx, cat in zip(new_transactions, categories):
        if tx.amount >= 0 or cat not in stats:
            flags.append(False)
            continue
        amt = float(abs(tx.amount))
        mu, sigma, p90 = stats[cat]
        z = (amt - mu) / sigma
        flags.append(z > Z_THRESHOLD and amt >= p90)

    return flags
