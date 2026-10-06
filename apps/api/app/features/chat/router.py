"""POST /chat: streams an answer about the user's own transactions as Server-Sent Events."""

import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth import CurrentUser
from app.db import connect
from app.features.chat.logic import stream_chat

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _primary_currency(user_id: str) -> str:
    with connect() as conn:
        row = conn.execute(
            "select currency from transactions where user_id = %s"
            " group by currency order by count(*) desc limit 1",
            (user_id,),
        ).fetchone()
    return row["currency"].strip() if row else "NGN"


@router.post("/chat")
def chat(body: ChatIn, user: CurrentUser) -> StreamingResponse:
    # the user is resolved before the stream opens, so nothing leaks to an unauthorized caller
    currency = _primary_currency(user.id)

    async def events() -> AsyncIterator[str]:
        try:
            async for token in stream_chat(user.id, body.message, currency):
                yield _sse("token", {"text": token})
            yield _sse("done", {})
        except Exception:
            logger.exception("Chat stream failed")
            yield _sse("error", {"message": "Chat stopped unexpectedly. Try asking again."})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
