"""
FinSight FastAPI entrypoint.

Run locally:
    uvicorn main:app --reload

Interactive docs: http://localhost:8000/docs
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import auth, chat, payments, report, transactions, upload

logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="FinSight API",
    version="0.2.0",
    description="AI-powered personal finance intelligence — backend.",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/", tags=["health"])
def root():
    return {"ok": True, "service": "finsight-api", "env": settings.env}


@app.get("/health", tags=["health"], include_in_schema=False)
def health():
    """Railway's uptime probe hits this. Keep it cheap — no DB roundtrip."""
    return {"ok": True}


app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(transactions.router)
app.include_router(chat.router)
app.include_router(report.router)
app.include_router(payments.router)
