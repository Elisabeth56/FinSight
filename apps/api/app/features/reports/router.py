"""POST /reports/savings: the Pro savings report."""

from fastapi import APIRouter

from app.auth import CurrentUser
from app.errors import AppError
from app.features.reports.logic import Report, build_report
from app.rate_limit import limit

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/savings", response_model=Report)
def savings_report(user: CurrentUser) -> Report:
    if not user.is_pro:
        raise AppError(402, "pro_required", "The savings report is part of Pro.")
    limit(user.id, "savings", per_minute=3)
    report = build_report(user.id)
    if report is None:
        raise AppError(404, "no_spending_yet", "Upload a statement to get your savings report.")
    return report
