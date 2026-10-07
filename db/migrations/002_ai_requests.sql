-- Per-user rate limiting for AI endpoints. Kept in Postgres because serverless instances
-- don't share memory; rows older than a day are pruned on insert.
create table ai_requests (
    user_id     text not null references profiles (id) on delete cascade,
    kind        text not null,
    created_at  timestamptz not null default now()
);

create index ai_requests_user_kind_idx on ai_requests (user_id, kind, created_at desc);
