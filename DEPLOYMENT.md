# FinSight — Deployment Guide

Deploys:
- **Backend** (FastAPI) → Railway
- **Frontend** (Next.js) → Vercel
- **Database + Auth** → Supabase (already hosted)
- **Payments** → Paystack (already hosted)

This is a **monorepo** with `backend/` and `frontend/` side by side. Both platforms support deploying from a subdirectory, so one GitHub repo covers everything.

---

## 1. Prepare the repo

```bash
cd finsight
git init
git add .
git commit -m "Initial commit"
```

Create a new repo on GitHub, then:

```bash
git remote add origin git@github.com:YOUR_USER/finsight.git
git branch -M main
git push -u origin main
```

The root `.gitignore` already excludes `.env`, `venv/`, `node_modules/`, and `.next/` — your secrets will not leak.

---

## 2. Deploy the backend (Railway)

1. Go to https://railway.app → sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → pick your `finsight` repo.
3. After it starts provisioning, click the service → **Settings** → **Root Directory** → set to `backend`.
4. **Variables** tab — paste all of these (values from your local `backend/.env`):

   ```
   ENV=production
   FRONTEND_ORIGIN=https://WILL_FILL_IN_LATER.vercel.app

   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_KEY=
   SUPABASE_JWT_SECRET=

   GROQ_API_KEY=
   GROQ_MODEL=llama-3.3-70b-versatile

   PAYSTACK_SECRET_KEY=
   PAYSTACK_PUBLIC_KEY=
   PAYSTACK_WEBHOOK_SECRET=
   PAYSTACK_PLAN_MONTHLY_NGN=
   PAYSTACK_PLAN_MONTHLY_USD=
   PAYSTACK_PLAN_YEARLY_NGN=
   PAYSTACK_PLAN_YEARLY_USD=
   ```

5. **Settings** → **Networking** → **Generate Domain**. Copy the URL, e.g.:
   ```
   https://finsight-backend-production-abcd.up.railway.app
   ```

6. Verify it's alive:
   ```bash
   curl https://YOUR-URL.up.railway.app/health
   # → {"ok":true}
   ```

> **Common snag**: if the deploy fails with "module not found" on `pandas` or `pdfplumber`, it's almost always because Nixpacks picked Python 3.13 instead of 3.11. Check that `backend/runtime.txt` is committed and says `python-3.11.10`.

---

## 3. Deploy the frontend (Vercel)

1. Go to https://vercel.com → sign in with GitHub → **Add New... → Project**.
2. Pick your `finsight` repo.
3. **Root Directory** → click **Edit** → select `frontend`.
4. **Framework Preset** should auto-detect as Next.js. Leave other build settings default.
5. **Environment Variables** — add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=<same as backend>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as backend>
   NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-RAILWAY-URL.up.railway.app
   ```

   Note the `NEXT_PUBLIC_` prefix — without it, Next.js won't ship these to the browser.

6. Click **Deploy**. After ~90 seconds you'll get a URL like:
   ```
   https://finsight-abcd.vercel.app
   ```

---

## 4. Close the URL loop

Production URLs now exist on both sides. Time to make them trust each other.

### 4a. Update Railway's FRONTEND_ORIGIN
Railway → your service → **Variables** → edit `FRONTEND_ORIGIN`:

```
FRONTEND_ORIGIN=https://finsight-abcd.vercel.app
```

Railway will auto-redeploy. (If you also want preview deploys to work, add them comma-separated: `FRONTEND_ORIGIN=https://finsight.vercel.app,https://finsight-git-main-yourname.vercel.app`.)

### 4b. Supabase redirect URLs
Supabase → your project → **Authentication** → **URL Configuration**.

**Site URL**:
```
https://finsight-abcd.vercel.app
```

**Redirect URLs** (add all of these):
```
https://finsight-abcd.vercel.app/**
http://localhost:3000/**
```

The `/**` wildcard covers `/callback`, `/billing/callback`, etc.

### 4c. Google OAuth console
Only needed if you enabled Google sign-in.

Google Cloud Console → **APIs & Services** → **Credentials** → your OAuth 2.0 client.

**Authorized JavaScript origins**:
```
https://finsight-abcd.vercel.app
http://localhost:3000
```

**Authorized redirect URIs**:
```
https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback
```

(That Supabase callback is always the OAuth target — the redirect back to your own site happens client-side after Supabase handles the token exchange.)

### 4d. Paystack webhook + callback
Paystack Dashboard → **Settings** → **API Keys & Webhooks**.

**Webhook URL**:
```
https://YOUR-BACKEND-RAILWAY-URL.up.railway.app/payments/webhook
```

The callback URL for checkout is set *per transaction* by our backend (`/payments/initialize` uses `FRONTEND_ORIGIN/billing/callback`), so no dashboard config needed there — it just works once `FRONTEND_ORIGIN` is correct.

**Switch to live keys**: if you used test keys for development, swap `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` in Railway for your live keys. Also regenerate the Paystack plans in live mode (test-mode plan codes don't work against live keys).

---

## 5. Env var matrix — what lives where

| Variable | Backend (Railway) | Frontend (Vercel) | Notes |
|---|---|---|---|
| `ENV` | ✅ `production` | — | Controls log level + `/docs` visibility |
| `FRONTEND_ORIGIN` | ✅ | — | Your `.vercel.app` URL(s), comma-separated |
| `SUPABASE_URL` | ✅ | — | Server-only variant |
| `NEXT_PUBLIC_SUPABASE_URL` | — | ✅ | Same value, `NEXT_PUBLIC_` prefix ships to browser |
| `SUPABASE_ANON_KEY` | ✅ | — | Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | ✅ | Browser |
| `SUPABASE_SERVICE_KEY` | ✅ | ❌ NEVER | Bypasses RLS — backend only |
| `SUPABASE_JWT_SECRET` | ✅ | — | For verifying user tokens |
| `GROQ_API_KEY` | ✅ | — | LLM calls all happen server-side |
| `PAYSTACK_SECRET_KEY` | ✅ | ❌ NEVER | |
| `PAYSTACK_PUBLIC_KEY` | ✅ | — | Only needed if you add Paystack Inline later |
| `PAYSTACK_PLAN_*` | ✅ (×4) | — | One per currency × interval |
| `NEXT_PUBLIC_API_URL` | — | ✅ | Your `.railway.app` URL |

**Rule of thumb**: any var without `NEXT_PUBLIC_` stays server-side. Anything ending in `_SECRET_KEY` or `_SERVICE_KEY` — if you ever feel tempted to put it in the frontend, stop. It belongs on Railway.

---

## 6. Smoke test

After everything is deployed and URLs are linked up, walk through this on your live site:

1. Visit `https://finsight-abcd.vercel.app` — marketing page loads
2. Click **Sign Up**, create an account with email+password → redirected to `/dashboard`
3. Sign out, sign back in with Google OAuth → redirected to `/dashboard`
4. **Upload** a CSV → transactions appear in the table
5. **Chat** → ask "Where did most of my money go?" → streaming response arrives
6. **Savings** → click generate → hits paywall (free tier)
7. **Billing** → click **Upgrade now** → redirected to Paystack checkout
8. Use a Paystack **test card** (`4084 0840 8408 4081`, any CVV, any future expiry, PIN `0000`, OTP `123456`):
   - Completes → redirected to `/billing/callback` → shows success → lands on dashboard
9. **Savings** again → report generates this time
10. Try uploading a second statement in the same month as a fresh free user → paywall modal appears

If any step fails, check both the Railway logs tab and the Vercel deployment logs. 90% of issues are env vars — one typo in `FRONTEND_ORIGIN` will break CORS silently.

---

## 7. Going forward

**To redeploy**: just `git push`. Both platforms watch `main` and redeploy automatically.

**Preview deploys**: Vercel creates a preview URL for every PR. The backend doesn't — Railway only builds on `main` by default. Usually fine; the frontend can point its preview at production Railway.

**Costs on free tier**:
- Railway: $5/mo usage credit free, which runs a hobby backend ~24/7 if it's light.
- Vercel: Hobby tier is free for personal, but no commercial use.
- Supabase: free tier covers 500MB DB + 50k monthly active users.
- Groq: free tier with rate limits — enough to demo.
- Paystack: no platform fees, only transaction fees (1.5% NGN, 3.9% USD).

When you're ready to go commercial: Vercel Pro is $20/mo, Railway Hobby is $5/mo baseline.
