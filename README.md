# FinSight

AI-powered personal finance intelligence. Upload a bank statement, chat with your money, discover where to save.

**Stack**: Next.js 16 (App Router) · FastAPI · Supabase (Postgres + Auth) · Groq (LLaMA 3.3) · LlamaIndex · Recharts · Paystack

> This project is being remodelled. Progress is tracked in #22 and decisions in `docs/decisions/`.

## Project layout

```
finsight/
├── apps/
│   ├── web/          # Next.js · TypeScript · Tailwind
│   └── api/          # FastAPI · Python 3.12 · uv
├── docs/             # architecture and decision records
└── pnpm-workspace.yaml
```

## Local development

Prerequisites: Node 22 with pnpm, Python 3.12+ with [uv](https://docs.astral.sh/uv/).

```bash
pnpm install
(cd apps/api && uv sync)
cp apps/web/.env.example apps/web/.env.local   # fill in values
cp apps/api/.env.example apps/api/.env          # fill in values
pnpm dev                                        # web on :3000, API on :8000
```

`pnpm lint`, `pnpm typecheck` and `pnpm test` run across both apps.

## Features

- **Upload**: CSV + PDF bank statement parsing with column auto-detection
- **Categorize**: LLM-based categorization into 12 fixed categories via Groq
- **Anomaly detection**: Per-category z-score against 90-day baseline
- **Chat**: RAG over your transactions with SSE streaming
- **Savings report**: On-demand AI-generated opportunities
- **Billing**: Paystack subscriptions + one-time payments in NGN/USD
- **Plan gating**: 1 upload/mo free · Pro unlocks unlimited + savings reports
