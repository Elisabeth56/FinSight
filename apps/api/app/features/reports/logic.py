"""Savings report: SQL works out monthly spend, the model picks the cuts, code does the maths.

The model only chooses a target and a percentage; every naira figure in the report is computed
here from the user's own rows, so totals always add up.
"""

from pydantic import BaseModel, Field

from app.ai.llm import fenced, generate_json, load_prompt
from app.db import connect

WINDOW_DAYS = 90


class Pick(BaseModel):
    target: str
    title: str = Field(max_length=80)
    description: str = Field(max_length=240)
    cut_percent: int = Field(ge=5, le=100)


class Picks(BaseModel):
    summary: str = Field(max_length=240)
    opportunities: list[Pick] = Field(min_length=1, max_length=6)


class Opportunity(BaseModel):
    title: str
    description: str
    target: str
    monthly_minor: int
    saving_minor: int


class Report(BaseModel):
    currency: str
    window_days: int
    summary: str
    total_saving_minor: int
    opportunities: list[Opportunity]


def spending_candidates(user_id: str) -> tuple[str, dict[str, dict]]:
    """Average monthly spend per category and per name over the last 90 days of data."""
    with connect() as conn:
        rows = conn.execute(
            "with window_rows as ("
            "  select * from transactions where user_id = %s and amount_minor < 0"
            "  and transaction_date > (select max(transaction_date) from transactions"
            "                          where user_id = %s) - %s"
            "  and currency = (select currency from transactions where user_id = %s"
            "                  group by currency order by count(*) desc limit 1))"
            " select 'C' as kind, category as name, currency, sum(-amount_minor) as total,"
            "   count(distinct date_trunc('month', transaction_date)) as months"
            " from window_rows where category not in ('Transfers', 'Income')"
            " group by category, currency"
            " union all"
            " select 'M', coalesce(merchant, description), currency, sum(-amount_minor),"
            "   count(distinct date_trunc('month', transaction_date))"
            " from window_rows where category not in ('Transfers', 'Income')"
            " group by 2, currency order by total desc",
            (user_id, user_id, WINDOW_DAYS, user_id),
        ).fetchall()
    if not rows:
        return "NGN", {}

    span_months = max(r["months"] for r in rows)
    currency = rows[0]["currency"].strip()
    candidates: dict[str, dict] = {}
    counters = {"C": 0, "M": 0}
    for r in rows:
        if r["kind"] == "M" and counters["M"] >= 12:
            continue
        counters[r["kind"]] += 1
        candidates[f"{r['kind']}{counters[r['kind']]}"] = {
            "name": r["name"],
            "monthly_minor": int(r["total"]) // span_months,
            "repeats": r["months"] > 1,
        }
    return currency, candidates


def build_report(user_id: str) -> Report | None:
    currency, candidates = spending_candidates(user_id)
    if not candidates:
        return None

    listing = "\n".join(
        f"{key}: {c['name']}, {c['monthly_minor'] // 100:,} {currency} a month"
        + (", repeats" if c["repeats"] else "")
        for key, c in candidates.items()
    )
    picks = generate_json(
        system=load_prompt("savings"),
        user=fenced("spending", listing),
        schema=Picks,
        size="large",
        temperature=0.2,
        name="savings",
    )

    # compute every amount here; drop picks that point at something we didn't list
    opportunities = []
    for pick in picks.opportunities:
        target = candidates.get(pick.target)
        if target is None:
            continue
        saving = round(target["monthly_minor"] * pick.cut_percent / 100 / 10_000) * 10_000
        opportunities.append(
            Opportunity(
                title=pick.title,
                description=pick.description,
                target=target["name"],
                monthly_minor=target["monthly_minor"],
                saving_minor=saving,
            )
        )
    return Report(
        currency=currency,
        window_days=WINDOW_DAYS,
        summary=picks.summary,
        total_saving_minor=sum(o.saving_minor for o in opportunities),
        opportunities=opportunities,
    )
