# 003. Backend shape and hosting: FastAPI on Vercel's Python runtime

Status: Proposed

## Context

Railway's free trial ended and took the API down. The backend needs Python: the PDF parser (pdfplumber, pandas) is the strongest part of the project and has no good TypeScript equivalent.

Workload: short requests, plus uploads that take up to about a minute and chat that streams for a few seconds. No WebSockets, no long-lived workers.

## Options

| | Vercel Python runtime | Google Cloud Run | Render free |
|---|---|---|---|
| Fit | FastAPI deploys as-is, streaming on by default | Any Docker image | Any Docker image |
| Limits | 300s per request, 2 GB memory, 500 MB bundle, 4.5 MB request body | 60 min requests, 32 MB body | Sleeps after 15 min idle; ~50s cold start |
| Cost | Hobby plan, free (non-commercial use) | Free tier, needs a billing card | Free |
| Previews | Per-PR preview next to the web preview | Manual | Manual |
| Ops | Same dashboard, logs and env vars as the web app | Separate GCP project | Separate dashboard |

Also considered: rewriting the backend in Next.js route handlers. Rejected because it means porting the parser to TypeScript, which is the riskiest work for the least gain.

## Decision

Two Vercel projects from one repo: `apps/web` (Next.js) and `apps/api` (FastAPI). The web app rewrites `/api/*` to the API deployment, so the browser only ever talks to one origin. That removes CORS entirely, which was behind the old "Failed to fetch" error.

Changes this forces in the code:
- Endpoints become plain `def` so FastAPI runs them in its threadpool. This also fixes the blocked event loop.
- Uploads cap at 4 MB (Vercel's body limit is 4.5 MB). Real statements are well under that.
- The upload request does all its work before responding. That is fine inside 300s once categorization is deduplicated (ADR 004).

**Spike:** stream SSE through the rewrite and confirm tokens arrive one by one. If they get buffered, the chat page calls the API origin directly with a single allowed CORS origin.

## Consequences

- Hobby forbids commercial use. Fine while Paystack runs in test mode; moving to live payments means Vercel Pro or Cloud Run.
- No background jobs. Anything slower than 300s would need a queue.

## Revisit when

Uploads approach 300s, statements over 4 MB become common, or real payments go live.
