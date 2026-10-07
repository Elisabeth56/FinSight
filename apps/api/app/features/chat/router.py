"""POST /chat: streams an answer about the user's own transactions as Server-Sent Events.

Events: `token` ({text}) while the answer streams, then `sources` ({count, start, end,
categories}) and `done`; `error` ({code, message}) if anything fails.
"""

import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth import CurrentUser
from app.db import connect
from app.errors import AppError
from app.features.chat.logic import answer
from app.rate_limit import limit

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
    # auth and the rate limit run before the stream opens, so failures are plain JSON errors
    limit(user.id, "chat", per_minute=10)
    currency = _primary_currency(user.id)

    async def events() -> AsyncIterator[str]:
        try:
            facts, tokens = await answer(user.id, body.message, currency)
            async for token in tokens:
                yield _sse("token", {"text": token})
            yield _sse("sources", facts.sources())
            yield _sse("done", {})
        except AppError as e:
            yield _sse("error", {"code": e.code, "message": e.message})
        except Exception:
            logger.exception("Chat stream failed")
            yield _sse(
                "error",
                {"code": "internal_error", "message": "Chat stopped unexpectedly. Ask again."},
            )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
