# 002. Auth: Neon Auth (managed Better Auth)

Status: Accepted (2026-10-06). Depends on the JWT spike below.

## Context

Supabase was both the database and the auth (Google OAuth, sessions). Moving to Neon means picking auth separately. The FastAPI backend must verify each request without calling the auth server every time.

## Options

| | Neon Auth | Better Auth, self-hosted in Next.js | Clerk |
|---|---|---|---|
| Where users live | `neon_auth` schema in the same database | Our tables in the same database | Clerk's servers |
| Google OAuth + email | Yes | Yes | Yes |
| Free tier | 60,000 MAU | Free (our code) | Free up to a user cap |
| Work for us | Least: managed endpoints, Next.js SDK | Moderate: auth routes, schema, JWT plugin to maintain | Low, but user records are outside our DB |
| API verification | JWT checked against a JWKS URL | JWT plugin exposes JWKS | JWKS |

## Decision

Neon Auth, with Google OAuth and email/password. A `profiles` row is created on first API request (the existing fallback logic, kept).

FastAPI verifies the bearer JWT against the JWKS URL, reusing the asymmetric path already in `core/auth.py`. The HS256 shared-secret path is deleted.

The demo account is an email/password user created by the seed script. "Try the demo" signs straight into it.

**Spike before committing (1 hour):** sign in on the web app, send the token to a protected FastAPI route, verify it via JWKS. If that doesn't work cleanly, fall back to self-hosted Better Auth with its JWT plugin. Same database, more code.

## Consequences

- One provider for data and users, one free tier to watch.
- Neon Auth is newer than Supabase Auth; fewer examples to lean on.

## Revisit when

The spike fails, or MAU nears the free cap.
