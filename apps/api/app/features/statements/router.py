"""Statements: upload, list and delete."""

import uuid

from fastapi import APIRouter, File, UploadFile

from app.auth import CurrentUser
from app.errors import AppError
from app.features.statements import logic
from app.features.statements.schemas import StatementOut

router = APIRouter(prefix="/statements", tags=["statements"])


@router.post("", response_model=StatementOut, status_code=201)
def upload(user: CurrentUser, file: UploadFile = File(...)) -> StatementOut:
    """Parses, categorizes and stores a CSV or PDF statement."""
    contents = file.file.read()
    return logic.upload_statement(user, contents, file.filename or "", file.content_type or "")


@router.get("", response_model=list[StatementOut])
def list_statements(user: CurrentUser) -> list[StatementOut]:
    return logic.list_statements(user.id)


@router.delete("/{statement_id}", status_code=204)
def delete(user: CurrentUser, statement_id: str) -> None:
    try:
        uuid.UUID(statement_id)
    except ValueError:
        raise AppError(404, "statement_not_found", "That statement no longer exists.") from None
    logic.delete_statement(user.id, statement_id)
