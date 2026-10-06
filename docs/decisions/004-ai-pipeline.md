# 004. AI pipeline: plain Groq SDK, SQL-computed numbers, deduplicated categorization

Status: Proposed

## Context

Three AI features: categorization at upload, chat, and the savings report. The current code works but has gaps:
- `llama-index` is installed but never imported.
- Chat sends up to 500 raw rows and lets the model add them up.
- The savings report lets the model estimate money amounts.
- No timeouts, no fallback on rate limits.
- Transaction descriptions are untrusted text and go into prompts unguarded.
- There's no eval, so quality has never been measured.

Groq free tier limits: about 30 requests and 12k tokens per minute and 1,000 requests a day on `llama-3.3-70b-versatile`; 14,400 requests a day on `llama-3.1-8b-instant`.

## Options

**Framework**
- LlamaIndex: saves nothing here, because retrieval is SQL filters, not vector search. Adds a large dependency tree to a function with a 500 MB limit.
- LangChain: same story.
- Groq SDK directly: everything FinSight needs fits in under 100 lines.

**Chat**
- A. Keep as is: intent → fetch rows → model summarizes. The model does arithmetic.
- B. Intent → SQL computes totals and top rows → model writes the answer from those numbers.
- C. Tool-calling agent that runs queries itself. More moving parts, harder to evaluate.

**Categorization**
- A. One LLM call per 40 rows (current).
- B. Normalize and deduplicate descriptions first, categorize unique ones, map back.
- C. Rules for obvious cases, LLM for the rest. Rejected earlier in favor of LLM-only for simplicity; still true.

## Decision

- **Remove LlamaIndex.** Use the Groq SDK through one module, `ai/llm.py`, with `generate_json()` and `stream()`. Every call gets a timeout, one retry with backoff on 429, then falls back to Gemini's free tier, then returns a friendly error.
- **Chat: option B.** Intent extraction runs on the small 8B model. The answer model gets exact totals plus the matching rows and is told not to compute.
- **Categorization: option B.** Pydantic-validated JSON output, temperature 0, retry once on a bad result.
- **Savings report:** the model picks the opportunity and a percentage to cut; code computes the naira amount.
- **Prompts** move to `ai/prompts/*.md`. Transaction text is wrapped in delimiters, and the model is told to ignore any instructions inside it.
- **Evals** live in `evals/`, run with one script:
  - categorization accuracy on about 100 labeled Nigerian transactions;
  - chat answer correctness on 30 questions against seed data, with expected numbers computed in SQL;
  - parser row counts on synthetic statement fixtures;
  - latency p50/p95 for each.

## Consequences

- Smaller bundle, faster cold starts, less to debug.
- Every number on screen and in chat is exact.
- The eval results table goes in the README.

## Revisit when

The eval shows chat missing questions that SQL filters can't express. That is the point to try option C.
