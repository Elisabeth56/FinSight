# 001. Database: Neon Postgres, accessed only through the API

Status: Accepted (2026-10-06)

## Context

The Supabase free project paused after inactivity and was then terminated, taking the data and auth with it. The schema was never committed, so it has to be rebuilt from the code either way.

FinSight's data is relational: transactions belong to statements, both belong to users, and every screen runs date-range filters and sums. That points to Postgres. The question is which host.

## Options

| | Neon | New Supabase project | MongoDB Atlas |
|---|---|---|---|
| Fit | Postgres, same as before | Postgres, same as before | Weak: monthly/category sums and joins are the main workload |
| Free tier | 1 GB per project, 100 CU-hours/month, scales to zero after 5 min and wakes on the next query. Not deleted when idle | 500 MB. Pauses after 7 days idle; this is what killed the last deploy | 512 MB |
| Auth | Neon Auth included (ADR 002) | Supabase Auth included | None |
| Branching | Database branch per PR preview | Branching on paid plans | No |
| Lock-in | Plain Postgres | Plain Postgres, but RLS + supabase-js tie the app to it | Proprietary query API |

## Decision

Neon Postgres in the Frankfurt region (`aws-eu-central-1`), next to the Vercel functions in `fra1`.

Access goes through the API only, using psycopg 3 and plain SQL. The supabase-py client is removed. The browser never queries the database, so tables don't need RLS; instead every query filters by `user_id` in SQL, and a test checks that one user can't read another's rows.

Schema lives in `db/migrations/` as numbered SQL files. `db/seed.sql` creates the demo account and its data.

## Consequences

- The first query after 5 idle minutes waits for Neon to wake, usually under a second.
- Aggregates move into SQL, which fixes the 1000-row truncation bug in the analytics summary.
- Each Vercel preview can get its own database branch.

## Revisit when

Storage passes 700 MB, CU-hours run out in a month, or a feature needs the browser to read data directly (then add RLS).
