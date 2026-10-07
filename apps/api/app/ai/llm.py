"""Every LLM call goes through here: JSON generation and token streaming with a fallback chain.

Providers are tried in order (Groq, then Gemini). A 429 gets one short retry on the same
provider before the next one takes over; timeouts and 5xx move on straight away. Both speak
the OpenAI chat-completions format, so one plain HTTP path serves them and swapping a
provider is a settings change.
"""

import json
import logging
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Literal

import httpx
from pydantic import BaseModel, ValidationError

from app.config import settings
from app.errors import AppError

logger = logging.getLogger(__name__)

Size = Literal["small", "large"]

PROMPTS = Path(__file__).parent / "prompts"
TIMEOUT = httpx.Timeout(30.0, connect=5.0)
STREAM_TIMEOUT = httpx.Timeout(60.0, connect=5.0)
MAX_RETRY_WAIT = 3.0


@dataclass(frozen=True)
class Provider:
    name: str
    base_url: str
    api_key: str
    models: dict[str, str]
    json_mode: bool
    # provider-specific request fields
    extra: dict


def providers() -> list[Provider]:
    """Configured providers in fallback order; ones without a key are skipped."""
    chain = [
        Provider(
            "groq",
            "https://api.groq.com/openai/v1",
            settings.groq_api_key,
            {"large": settings.groq_model_large, "small": settings.groq_model_small},
            json_mode=True,
            # gpt-oss reasons before answering and those tokens count against max_tokens and the
            # 8k tokens-a-minute free limit; these tasks are extraction and short answers
            extra={"reasoning_effort": "low"},
        ),
        Provider(
            "gemini",
            "https://generativelanguage.googleapis.com/v1beta/openai",
            settings.gemini_api_key,
            {"large": settings.gemini_model_large, "small": settings.gemini_model_small},
            json_mode=True,
            # Gemini 3.x reasons by default and counts it against max_tokens, which cut JSON
            # answers off mid-object; these tasks don't need it
            extra={"reasoning_effort": "minimal"},
        ),
    ]
    return [p for p in chain if p.api_key]


def busy() -> AppError:
    return AppError(503, "ai_busy", "FinSight's AI is busy right now. Try again in a minute.")


@cache
def load_prompt(name: str) -> str:
    """Prompts live in ai/prompts/<name>.md so they're versioned and reviewable on their own."""
    return (PROMPTS / f"{name}.md").read_text().strip()


def fenced(label: str, text: str) -> str:
    """Wraps untrusted text (narrations, questions) so the model treats it as data."""
    return f"<{label}>\n{text}\n</{label}>"


def generate_json[T: BaseModel](
    *,
    system: str,
    user: str,
    schema: type[T],
    size: Size = "large",
    temperature: float = 0.0,
    max_tokens: int = 2048,
    name: str = "",
) -> T:
    """Returns the model's answer parsed into `schema`; retries once with the validation error."""
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    for attempt in range(2):
        text = _complete(messages, size, temperature, max_tokens, name, json_mode=True)
        try:
            return schema.model_validate_json(_strip_fences(text))
        except ValidationError as e:
            logger.warning("llm %s returned invalid JSON (attempt %d): %s", name, attempt + 1, e)
            messages += [
                {"role": "assistant", "content": text},
                {
                    "role": "user",
                    "content": "That didn't match the required JSON shape. "
                    f"Errors: {e.errors()[:3]}. Reply with corrected JSON only.",
                },
            ]
    raise AppError(502, "ai_bad_output", "The AI gave an answer we couldn't use. Try again.")


def _complete(
    messages: list[dict],
    size: Size,
    temperature: float,
    max_tokens: int,
    name: str,
    json_mode: bool,
) -> str:
    for provider in providers():
        body = {
            "model": provider.models[size],
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **provider.extra,
        }
        if json_mode and provider.json_mode:
            body["response_format"] = {"type": "json_object"}

        for attempt in range(2):
            started = time.monotonic()
            try:
                res = httpx.post(
                    f"{provider.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {provider.api_key}"},
                    json=body,
                    timeout=TIMEOUT,
                )
            except httpx.HTTPError as e:
                logger.warning("llm %s: %s failed: %s", name, provider.name, e)
                break
            if res.status_code == 429 and attempt == 0:
                time.sleep(_retry_after(res))
                continue
            if res.status_code >= 400:
                logger.warning("llm %s: %s returned %d", name, provider.name, res.status_code)
                break

            data = res.json()
            _log_usage(name, provider, body["model"], data.get("usage", {}), started)
            return data["choices"][0]["message"]["content"] or ""
    raise busy()


async def stream(
    *,
    system: str,
    user: str,
    size: Size = "large",
    temperature: float = 0.3,
    name: str = "",
) -> AsyncIterator[str]:
    """Yields text deltas. Falls back only before the first token, so answers never repeat."""
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    for provider in providers():
        body = {
            "model": provider.models[size],
            "messages": messages,
            "temperature": temperature,
            "stream": True,
            **provider.extra,
        }
        sent_any = False
        started = time.monotonic()
        try:
            async with (
                httpx.AsyncClient(timeout=STREAM_TIMEOUT) as client,
                client.stream(
                    "POST",
                    f"{provider.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {provider.api_key}"},
                    json=body,
                ) as res,
            ):
                if res.status_code >= 400:
                    logger.warning("llm %s: %s returned %d", name, provider.name, res.status_code)
                    continue
                async for line in res.aiter_lines():
                    if not line.startswith("data: ") or line == "data: [DONE]":
                        continue
                    delta = json.loads(line[6:])["choices"][0]["delta"].get("content")
                    if delta:
                        sent_any = True
                        yield delta
            _log_usage(name, provider, body["model"], {}, started)
            return
        except httpx.HTTPError as e:
            logger.warning("llm %s: %s stream failed: %s", name, provider.name, e)
            if sent_any:
                raise busy() from e
    raise busy()


def _strip_fences(text: str) -> str:
    """Some providers wrap JSON in ```json fences even when asked not to."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _retry_after(res: httpx.Response) -> float:
    try:
        return min(float(res.headers.get("retry-after", "1")), MAX_RETRY_WAIT)
    except ValueError:
        return 1.0


def _log_usage(name: str, provider: Provider, model: str, usage: dict, started: float) -> None:
    logger.info(
        "llm %s provider=%s model=%s in=%s out=%s ms=%d",
        name,
        provider.name,
        model,
        usage.get("prompt_tokens"),
        usage.get("completion_tokens"),
        (time.monotonic() - started) * 1000,
    )
