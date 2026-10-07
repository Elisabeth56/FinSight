"""FinSight evals: parsing, categorization and chat against golden sets.

Run from the repo root with `pnpm eval` (or from apps/api: `uv run python ../../evals/run.py`).
Needs EVAL_DATABASE_URL: a scratch Postgres the chat suite wipes and reseeds with the demo data.
The AI suites need GROQ_API_KEY or GEMINI_API_KEY and are skipped without one.
Prints a table, writes results/latest.json and compares it with results/baseline.json.
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

HERE = Path(__file__).parent
API = HERE.parent / "apps" / "api"
sys.path.insert(0, str(API))
load_dotenv(API / ".env")
DB_URL = os.environ.get("EVAL_DATABASE_URL", "")
os.environ.setdefault("DATABASE_URL", DB_URL or "postgresql://localhost/unused")

import psycopg  # noqa: E402
from psycopg import sql  # noqa: E402

from app.ai.llm import providers  # noqa: E402
from app.errors import AppError  # noqa: E402
from app.features.chat.logic import answer, money  # noqa: E402
from app.features.statements.categorize import categorize_all  # noqa: E402
from app.features.statements.parser import parse_statement  # noqa: E402
from app.features.statements.schemas import ParsedTransaction  # noqa: E402

EVAL_USER = "eval-user"
# free-tier AI limits are per minute; pausing keeps rate limits from scoring as wrong answers
PAUSE_SECONDS = float(os.environ.get("EVAL_PAUSE_SECONDS", "6"))


class Usage(logging.Handler):
    """Collects tokens and latency from the llm module's per-call log line."""

    def __init__(self) -> None:
        super().__init__()
        self.calls: list[dict] = []

    def emit(self, record: logging.LogRecord) -> None:
        if (
            isinstance(record.msg, str)
            and record.msg.startswith("llm %s provider=")
            and len(record.args or ()) == 6
        ):
            name, provider, model, tokens_in, tokens_out, ms = record.args  # type: ignore[misc]
            self.calls.append(
                {
                    "name": name,
                    "provider": provider,
                    "model": model,
                    "in": tokens_in or 0,
                    "out": tokens_out or 0,
                    "ms": ms,
                }
            )

    def summary(self, name: str) -> dict:
        calls = [c for c in self.calls if c["name"].startswith(name)]
        return {
            "calls": len(calls),
            "tokens_in": sum(c["in"] for c in calls),
            "tokens_out": sum(c["out"] for c in calls),
            "models": sorted({f"{c['provider']}/{c['model']}" for c in calls}),
        }


def read_cases(name: str) -> list[dict]:
    return [json.loads(line) for line in (HERE / name).read_text().splitlines() if line.strip()]


def percentile(values: list[float], share: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return round(ordered[min(len(ordered) - 1, int(share * len(ordered)))], 1)


# ---- parsing ---------------------------------------------------------------------------


def eval_parsing() -> dict:
    """Row counts and totals must match the seed the fixtures were built from."""
    files = []
    for case in read_cases("parsing.jsonl"):
        data = (HERE / "fixtures" / case["file"]).read_bytes()
        kind = "application/pdf" if case["file"].endswith(".pdf") else "text/csv"
        started = time.monotonic()
        result = parse_statement(data, kind, case["file"])
        total = sum(int(t.amount * 100) for t in result.transactions)
        files.append(
            {
                "file": case["file"],
                "rows_ok": len(result.transactions) == case["rows"],
                "total_ok": total == case["total_minor"] and result.currency == case["currency"],
                "rows": len(result.transactions),
                "ms": round((time.monotonic() - started) * 1000),
            }
        )
    passed = sum(f["rows_ok"] and f["total_ok"] for f in files)
    return {"files": files, "accuracy": round(passed / len(files), 3)}


# ---- categorization --------------------------------------------------------------------


def eval_categorize(usage: Usage) -> dict:
    """Category accuracy and whether the readable name keeps the key word."""
    cases = read_cases("categorize.jsonl")
    txs = [
        ParsedTransaction(
            transaction_date=date(2026, 3, 1),
            description=c["description"],
            amount=Decimal(c["amount"]),
        )
        for c in cases
    ]
    started = time.monotonic()
    results = categorize_all(txs)
    elapsed = time.monotonic() - started
    misses = [
        {"description": c["description"], "expected": c["category"], "got": r.category}
        for c, r in zip(cases, results, strict=True)
        if r.category != c["category"]
    ]
    named = sum(
        c["merchant_has"] in (r.merchant or "").lower() for c, r in zip(cases, results, strict=True)
    )
    return {
        "cases": len(cases),
        "accuracy": round(1 - len(misses) / len(cases), 3),
        "name_hit_rate": round(named / len(cases), 3),
        "fallbacks": sum(r.source == "fallback" for r in results),
        "seconds": round(elapsed, 1),
        "usage": usage.summary("categorize"),
        "misses": misses,
    }


# ---- chat ------------------------------------------------------------------------------


def seed_eval_user() -> None:
    """Fresh schema and the demo account under EVAL_USER, so expected figures are known."""
    os.environ["DATABASE_URL"] = DB_URL
    from scripts import db

    with psycopg.connect(DB_URL, autocommit=True) as conn:
        conn.execute("drop schema public cascade; create schema public")
    db.migrate()
    db.seed(EVAL_USER)


def expected_minor(case: dict) -> int:
    """The figure a correct answer must contain, computed in SQL from the seeded rows."""
    where = [sql.SQL("user_id = %s"), sql.SQL("transaction_date between %s and %s")]
    params: list = [EVAL_USER, case["start"], case["end"]]
    if case.get("category"):
        where.append(sql.SQL("category = %s"))
        params.append(case["category"])
    if case.get("name"):
        where.append(sql.SQL("(description ilike %s or merchant ilike %s)"))
        params += [f"%{case['name']}%"] * 2
    measure = {
        "spent": sql.SQL("coalesce(sum(-amount_minor) filter (where amount_minor < 0), 0)"),
        "received": sql.SQL("coalesce(sum(amount_minor) filter (where amount_minor > 0), 0)"),
        "largest": sql.SQL("coalesce(-min(amount_minor), 0)"),
    }[case["measure"]]
    query = sql.SQL("select {} from transactions where {}").format(
        measure, sql.SQL(" and ").join(where)
    )
    with psycopg.connect(DB_URL) as conn:
        row = conn.execute(query, params).fetchone()
    return int(row[0]) if row else 0


async def ask(question: str) -> tuple[str, float]:
    started = time.monotonic()
    _, tokens = await answer(EVAL_USER, question, "NGN")
    text = "".join([t async for t in tokens])
    return text, time.monotonic() - started


def judge(case: dict, text: str) -> bool:
    """Figure cases pass when the exact amount appears; the rest pass when no amount does."""
    # people write naira as ₦, N or NGN; read them all as ₦
    plain = re.sub(r"\b(?:NGN\s?|N)(?=\d)", "₦", text)
    if case["expect"] == "figure":
        figure = money(expected_minor(case), "NGN")
        return figure in plain or figure[1:] in plain
    return not any(f"₦{d}" in plain for d in "123456789")


def eval_chat(usage: Usage) -> dict:
    seed_eval_user()
    results, latencies = [], []
    for case in read_cases("chat.jsonl"):
        time.sleep(PAUSE_SECONDS)
        try:
            text, seconds = asyncio.run(ask(case["question"]))
        except AppError as e:
            results.append(
                {"question": case["question"], "ok": False, "answer": f"error: {e.code}"}
            )
            continue
        latencies.append(seconds * 1000)
        results.append(
            {"question": case["question"], "ok": judge(case, text), "answer": text[:300]}
        )
    return {
        "cases": len(results),
        "accuracy": round(sum(r["ok"] for r in results) / len(results), 3),
        "p50_ms": percentile(latencies, 0.5),
        "p95_ms": percentile(latencies, 0.95),
        "usage": {k: usage.summary(k) for k in ("chat_intent", "chat_answer")},
        "failures": [r for r in results if not r["ok"]],
    }


# ---- report ----------------------------------------------------------------------------


def run() -> dict:
    usage = Usage()
    logging.getLogger("app.ai.llm").addHandler(usage)
    logging.getLogger("app.ai.llm").setLevel(logging.INFO)
    results: dict = {
        "at": datetime.now(UTC).isoformat(timespec="seconds"),
        "parsing": eval_parsing(),
    }
    if not providers():
        results["skipped"] = "categorize and chat: set GROQ_API_KEY or GEMINI_API_KEY"
        return results
    results["categorize"] = eval_categorize(usage)
    if not DB_URL:
        results["skipped"] = "chat: set EVAL_DATABASE_URL to a scratch database"
        return results
    results["chat"] = eval_chat(usage)
    return results


def print_table(results: dict, baseline: dict | None) -> None:
    rows = [("parsing: files right", results["parsing"]["accuracy"])]
    if "categorize" in results:
        rows += [
            ("categorize: accuracy", results["categorize"]["accuracy"]),
            ("categorize: names kept", results["categorize"]["name_hit_rate"]),
        ]
    if "chat" in results:
        rows += [
            ("chat: answers right", results["chat"]["accuracy"]),
            ("chat: p50 ms", results["chat"]["p50_ms"]),
            ("chat: p95 ms", results["chat"]["p95_ms"]),
        ]
    print(f"\n{'metric':<26}{'now':>10}{'baseline':>10}")
    for label, value in rows:
        suite, key = label.split(":")[0], _key(label)
        before = (baseline or {}).get(suite, {}).get(key, "")
        print(f"{label:<26}{value:>10}{before!s:>10}")
    if "skipped" in results:
        print(f"\nskipped {results['skipped']}")


def _key(label: str) -> str:
    return {
        "files right": "accuracy",
        "accuracy": "accuracy",
        "names kept": "name_hit_rate",
        "answers right": "accuracy",
        "p50 ms": "p50_ms",
        "p95 ms": "p95_ms",
    }[label.split(": ")[1]]


def main() -> None:
    results = run()
    out = HERE / "results"
    out.mkdir(exist_ok=True)
    (out / "latest.json").write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str))
    baseline_path = out / "baseline.json"
    baseline = json.loads(baseline_path.read_text()) if baseline_path.exists() else None
    print_table(results, baseline)
    # CI runs without AI keys: the parsing suite still has to be perfect
    if "--ci" in sys.argv and results["parsing"]["accuracy"] < 1:
        sys.exit("parsing eval failed")
    if "--save-baseline" in sys.argv:
        baseline_path.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str))
        print("saved as the new baseline")


if __name__ == "__main__":
    main()
