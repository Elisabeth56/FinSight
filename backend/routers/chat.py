"""Streaming chat endpoint. Emits Server-Sent Events."""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.auth import get_current_user
from db.supabase import get_supabase_user
from schemas.auth import CurrentUser
from services.chat_service import stream_chat

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


def _sse(event: str, data: dict | str) -> str:
    """Format an SSE frame."""
    payload = data if isinstance(data, str) else json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


@router.post("")
async def chat(
    body: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    sb = get_supabase_user(user.access_token)

    # Pull currency from the user's most recent transaction (cheap, single query)
    last = (
        sb.table("transactions")
        .select("currency")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    currency = last[0]["currency"] if last else "USD"

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for token in stream_chat(sb, user.id, body.message, currency):
                yield _sse("token", {"text": token})
            yield _sse("done", {"ok": True})
        except Exception as e:
            logger.exception("Chat stream failed")
            yield _sse("error", {"message": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering if proxied
            "Connection": "keep-alive",
        },
    )
