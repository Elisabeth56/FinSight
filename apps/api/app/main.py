"""FinSight API entrypoint. Locally: `pnpm dev` (uvicorn app.main:app --reload)."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import errors
from app.config import settings
from app.features.analytics.router import router as analytics
from app.features.chat.router import router as chat
from app.features.me.router import router as me
from app.features.payments.router import router as payments
from app.features.reports.router import router as reports
from app.features.statements.router import router as statements
from app.features.transactions.router import router as transactions

logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="FinSight API",
    version="0.3.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)

# in production the web app proxies /api/* here on the same origin; CORS covers local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
errors.install(app)


@app.get("/health", include_in_schema=False)
def health() -> dict:
    return {"ok": True}


for router in (me, statements, transactions, analytics, chat, reports, payments):
    app.include_router(router)
