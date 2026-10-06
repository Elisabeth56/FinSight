"""POST /reports/savings: the Pro savings report."""

from fastapi import APIRouter

from app.auth import CurrentUser
from app.errors import AppError
from app.features.reports.logic import generate_savings_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/savings")
def savings_report(user: CurrentUser) -> dict:
    if not user.is_pro:
        raise AppError(402, "pro_required", "The savings report is part of Pro.")
    return generate_savings_report(user.id)
