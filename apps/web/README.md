# FinSight web

Next.js app: the landing page, sign-in (Neon Auth) and the dashboard. The root [README](../../README.md) covers setup for the whole repo.

- `/api/auth/*` is Neon Auth's handler, proxied on this origin so session cookies are first-party.
- Every other `/api/*` request is forwarded to the FastAPI app at `API_ORIGIN`, so the browser never makes a cross-origin call.
- `/demo` signs into the seeded demo account (`DEMO_EMAIL` / `DEMO_PASSWORD`).

Env vars are listed in `.env.example`.
