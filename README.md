# FinSight

AI-powered personal finance intelligence. Upload a bank statement, chat with your money, discover where to save.

**Stack**: Next.js 16 (App Router) · FastAPI · Supabase (Postgres + Auth) · Groq (LLaMA 3.3) · LlamaIndex · Recharts · Paystack

## Project layout

```
finsight/
├── backend/          # FastAPI · Python 3.11
├── frontend/         # Next.js · TypeScript · Tailwind
├── DEPLOYMENT.md     # Production deploy guide (Railway + Vercel)
└── .gitignore
```

## Local development

### Prerequisites
- Python 3.11 (pyenv recommended)
- Node.js 20+
- A Supabase project (free tier is fine)
- A Groq API key (free tier)
- A Paystack test account

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in values
uvicorn main:app --reload
```

Visit `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # fill in values
npm run dev
```

Visit `http://localhost:3000`.

### Supabase setup

Run these SQL files in the Supabase SQL editor in order:

1. `backend/db/schema.sql` — users, statements, transactions, RLS
2. `backend/db/schema_section3.sql` — Paystack subscriptions, webhook log

Then in **Authentication → Providers**, enable **Google** (requires a Google Cloud OAuth client).

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full walkthrough.

**Short version**:
- Frontend → Vercel (root directory: `frontend`)
- Backend → Railway (root directory: `backend`)
- Database + Auth → Supabase
- Payments → Paystack

## Features

- **Upload**: CSV + PDF bank statement parsing with column auto-detection
- **Categorize**: LLM-based categorization into 12 fixed categories via Groq
- **Anomaly detection**: Per-category z-score against 90-day baseline
- **Chat**: RAG over your transactions with SSE streaming
- **Savings report**: On-demand AI-generated opportunities
- **Billing**: Paystack subscriptions + one-time payments in NGN/USD
- **Plan gating**: 1 upload/mo free · Pro unlocks unlimited + savings reports
