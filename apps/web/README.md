# FinSight

An AI-powered personal finance dashboard. Upload a bank statement, get automatic spend categorization, trend charts, anomaly detection, and a chat interface to ask questions about your money — powered by Groq + LLaMA 3.

---

## Stack

- **Next.js** — frontend
- **FastAPI** — Python backend
- **Groq + LLaMA 3** — fast LLM inference
- **LlamaIndex** — document parsing & RAG
- **PostgreSQL (Supabase)** — database
- **Recharts** — data visualization

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Groq API key](https://console.groq.com)
- [Supabase](https://supabase.com) project

### Setup

```bash
git clone https://github.com/your-username/finsight.git
cd finsight

# Frontend
cd frontend && npm install

# Backend
cd ../backend && pip install -r requirements.txt

# Environment
cp .env.example .env
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY

# Run
npm run dev                      # → localhost:3000
uvicorn main:app --reload        # → localhost:8000
```

---

## Project Structure

```
finsight/
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
├── backend/
│   ├── main.py
│   ├── routers/          # /upload  /chat  /report
│   ├── services/
│   │   ├── parser.py
│   │   ├── categorize.py
│   │   └── chat.py
│   └── db/
└── .env.example
```

---

## Environment Variables

```env
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## License

MIT