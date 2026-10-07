# 005. Payments: one-time Pro passes, verified on return, no webhooks

Status: Accepted (2026-10-06)

## Context

Paystack allows one webhook URL per account. FinSight shares its Paystack account with another app, so their webhooks collide.

Separately, Pro never expires today: payments set `plan = 'pro'` and nothing sets it back.

FinSight is a portfolio product running in Paystack test mode, and Vercel Hobby (ADR 003) doesn't allow commercial use.

## Options

| | Effort | Handles renewals | Fixes the collision |
|---|---|---|---|
| A. Separate Paystack account or business for FinSight, keep webhooks + subscriptions | Account setup, plan codes, more code to test | Yes | Yes |
| B. One-time passes only (Pro for 1 month or 1 year), verified when the user returns from checkout | Smallest; the verify endpoint already exists | No renewals: users buy again | Yes, no webhook needed |
| C. A small proxy that receives the shared webhook and forwards by `metadata.app` | A third service to host and keep alive | Yes | Yes |

## Decision

Option B, in NGN and USD.

Flow:
1. `POST /api/payments` initializes a transaction and stores a `payments` row with its `reference`.
2. Paystack redirects back to `/dashboard/billing/callback`, which calls the verify endpoint.
3. Verify checks with Paystack, then marks the row paid and extends `profiles.pro_until` in one database transaction.
4. Verifying the same reference twice does nothing the second time.

The webhook route and the subscription tables are removed.

## Consequences

- If a user closes the tab before returning, the payment stays pending. The billing page checks pending references on load and verifies them, so it heals on the next visit.
- No auto-renewal, which fits a portfolio demo.

## Revisit when

FinSight takes real payments. Then do option A with its own Paystack account and Vercel Pro.
