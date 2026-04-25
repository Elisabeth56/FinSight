"""Real upload endpoint. Runs the full pipeline and persists to Supabase."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from core.auth import get_current_user
from core.plans import check_upload_quota
from db.supabase import get_supabase_user
from schemas.auth import CurrentUser
from schemas.transactions import UploadResult
from services.anomaly import detect_anomalies
from services.categorize import categorize_all
from services.parser import parse_statement

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=UploadResult)
async def upload_statement(
    file: UploadFile = File(...),
    user: CurrentUser = Depends(check_upload_quota),
) -> UploadResult:
    # ----- Validate -----
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # ----- Parse -----
    try:
        parsed = parse_statement(contents, file.content_type or "", file.filename or "")
    except Exception as e:
        logger.exception("Parse failed")
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    if not parsed.transactions:
        raise HTTPException(
            status_code=422,
            detail="No transactions found. Check the file format.",
        )

    sb = get_supabase_user(user.access_token)
    file_type = "pdf" if (file.filename or "").lower().endswith(".pdf") else "csv"

    # ----- Insert statement row -----
    stmt_row = (
        sb.table("statements")
        .insert(
            {
                "user_id": user.id,
                "filename": file.filename,
                "file_type": file_type,
                "status": "processing",
                "period_start": parsed.period_start.isoformat() if parsed.period_start else None,
                "period_end": parsed.period_end.isoformat() if parsed.period_end else None,
                "row_count": len(parsed.transactions),
            }
        )
        .execute()
        .data[0]
    )
    statement_id = stmt_row["id"]

    # ----- Categorize -----
    try:
        categories = categorize_all(parsed.transactions)
    except Exception as e:
        logger.exception("Categorization failed")
        sb.table("statements").update(
            {"status": "failed", "error": f"categorization: {e}"}
        ).eq("id", statement_id).execute()
        raise HTTPException(status_code=502, detail="Categorization failed")

    # ----- Anomaly baseline from history -----
    since = (date.today() - timedelta(days=90)).isoformat()
    hist_rows = (
        sb.table("transactions")
        .select("category, amount, transaction_date")
        .eq("user_id", user.id)
        .gte("transaction_date", since)
        .execute()
        .data
        or []
    )
    historical = [
        (r["category"] or "Other", Decimal(str(r["amount"])), date.fromisoformat(r["transaction_date"]))
        for r in hist_rows
    ]
    anomaly_flags = detect_anomalies(parsed.transactions, categories, historical)

    # ----- Bulk insert transactions -----
    rows = [
        {
            "user_id": user.id,
            "statement_id": statement_id,
            "transaction_date": t.transaction_date.isoformat(),
            "description": t.description,
            "amount": str(t.amount),
            "currency": parsed.currency,
            "category": cat,
            "category_source": "llm",
            "is_anomaly": anomaly,
            "raw": t.raw,
        }
        for t, cat, anomaly in zip(parsed.transactions, categories, anomaly_flags)
    ]
    CHUNK = 200
    for i in range(0, len(rows), CHUNK):
        sb.table("transactions").insert(rows[i : i + CHUNK]).execute()

    sb.table("statements").update({"status": "ready"}).eq("id", statement_id).execute()

    return UploadResult(
        statement_id=statement_id,
        filename=file.filename or "",
        currency=parsed.currency,
        period_start=parsed.period_start,
        period_end=parsed.period_end,
        transaction_count=len(parsed.transactions),
        anomaly_count=sum(anomaly_flags),
    )
