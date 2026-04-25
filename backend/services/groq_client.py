"""Thin wrapper around the Groq client. Centralizes model + error handling."""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any, AsyncIterator

from groq import AsyncGroq, Groq

from core.config import settings

logger = logging.getLogger(__name__)


@lru_cache
def get_groq() -> Groq:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return Groq(api_key=settings.groq_api_key)


@lru_cache
def get_async_groq() -> AsyncGroq:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return AsyncGroq(api_key=settings.groq_api_key)


def chat_json(
    system: str,
    user: str,
    *,
    temperature: float = 0.0,
    max_tokens: int = 4096,
) -> Any:
    """
    Synchronous JSON-mode chat. Returns parsed JSON.
    Use for categorization and savings report where we need structured output.
    """
    client = get_groq()
    resp = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.error("Groq returned malformed JSON: %s", content[:500])
        raise


async def chat_stream(
    system: str,
    user: str,
    *,
    temperature: float = 0.3,
) -> AsyncIterator[str]:
    """
    Async streaming chat. Yields text deltas as they arrive.
    Used by the /chat SSE endpoint.
    """
    client = get_async_groq()
    stream = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
