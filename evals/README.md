# Evals

Golden sets for the three things FinSight has to get right, and one script that scores them.

| Suite | Cases | Passes when |
|---|---|---|
| `parsing.jsonl` | 3 statements (GTBank CSV, Access CSV, OPay-style PDF) | row count, total and currency match the seed they were built from |
| `categorize.jsonl` | 102 labelled Nigerian narrations, all 12 categories | the category matches; the readable name keeps the key word |
| `chat.jsonl` | 25 questions about the demo account, 5 it can't answer | the answer contains the amount SQL computes, or no amount at all |

```bash
# from the repo root
EVAL_DATABASE_URL=postgresql://localhost/finsight_eval GROQ_API_KEY=... pnpm eval
pnpm eval --save-baseline   # keep this run as the baseline to compare against
```

`EVAL_DATABASE_URL` must be a scratch database: the chat suite drops its schema and reseeds the demo account. Without an AI key, only the parsing suite runs (that's what CI does). Results go to `results/latest.json`; `results/baseline.json` is the committed comparison point.

The fixtures are generated from the seed with `uv run python ../../evals/make_fixtures.py` (from `apps/api`), so expected counts and totals can't drift from the demo data.
