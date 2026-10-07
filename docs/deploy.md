# Deploy

Two Vercel projects build from this repo on every push, both in `fra1` (Frankfurt), next to Neon in `aws-eu-central-1`.

| Project | Root directory | Production URL |
|---|---|---|
| `finsight` | `apps/web` | https://finsight-elisabeth-nnamanis-projects.vercel.app |
| `finsight-api` | `apps/api` | https://finsight-api-elisabeth-nnamanis-projects.vercel.app |

## How the two find each other

The web app forwards `/api/*` to the API (`next.config.js`), so the browser only ever calls one origin. `lib/api-origin.js` picks the target:
- Production uses `API_ORIGIN`.
- A preview uses the API preview from the same branch: `finsight-api-git-<branch>-elisabeth-nnamanis-projects.vercel.app`.
- Vercel shortens hostnames over 63 characters in a way we can't predict. Branch names longer than about 18 characters therefore fall back to `API_PRODUCTION_ORIGIN`.

Web previews sit behind Vercel login. API deployments are public because the web preview's server calls them, and every route checks the Neon Auth JWT anyway.

## Environment variables

Same names as the `.env.example` files. Set per environment in each project's settings.

- **web:**
  - `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`
  - `DEMO_EMAIL` and `DEMO_PASSWORD`
  - `NEXT_PUBLIC_SITE_URL`
  - `API_ORIGIN` (production) and `API_PRODUCTION_ORIGIN` (preview)
- **api:**
  - `APP_ENV` (`production` or `preview`)
  - `DATABASE_URL`
  - `AUTH_JWKS_URL` and `AUTH_AUDIENCE`
  - `FRONTEND_ORIGIN`
  - `GROQ_API_KEY`, and optionally `GEMINI_API_KEY` and `PAYSTACK_SECRET_KEY`

## Database branch per preview

Install the Neon integration on the `finsight-api` project. Each preview deployment then gets its own Neon branch, copied from `main` with its data, and its own preview-scoped `DATABASE_URL`. Until it's installed, previews read and write the production database.

Migrations and the demo seed run from a machine with database access:

```bash
pnpm db:migrate && pnpm db:seed
```

## Neon Auth domains

Neon Auth refuses sign-ins from origins it doesn't trust. Add the production URL and the preview pattern under **Auth → Domains** in the Neon console. Localhost is trusted by default.
