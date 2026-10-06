-- FinSight schema. Money is stored as signed integer minor units (kobo, cents):
-- negative = money out, positive = money in.

create extension if not exists pg_trgm;

-- One row per signed-in user. id is the Neon Auth user id (text, not a uuid).
create table profiles (
    id          text primary key,
    email       text not null,
    full_name   text,
    -- Pro is active while pro_until is in the future; no flag to forget to reset
    pro_until   timestamptz,
    created_at  timestamptz not null default now()
);

create table statements (
    id            uuid primary key default gen_random_uuid(),
    user_id       text not null references profiles (id) on delete cascade,
    filename      text not null,
    file_type     text not null check (file_type in ('csv', 'pdf')),
    file_sha256   text not null,
    status        text not null default 'processing'
                  check (status in ('processing', 'ready', 'failed')),
    error         text,
    currency      char(3) not null,
    period_start  date,
    period_end    date,
    row_count     integer not null default 0 check (row_count >= 0),
    created_at    timestamptz not null default now(),
    -- the same file uploaded twice would double every total
    unique (user_id, file_sha256)
);

-- free-plan quota counts this month's uploads per user
create index statements_user_created_idx on statements (user_id, created_at desc);

create table transactions (
    id                uuid primary key default gen_random_uuid(),
    user_id           text not null references profiles (id) on delete cascade,
    statement_id      uuid not null references statements (id) on delete cascade,
    transaction_date  date not null,
    description       text not null,
    merchant          text,
    amount_minor      bigint not null,
    currency          char(3) not null,
    category          text not null default 'Other' check (category in (
                          'Food & Dining', 'Groceries', 'Transport', 'Shopping',
                          'Entertainment', 'Bills & Utilities', 'Health', 'Travel',
                          'Education', 'Transfers', 'Income', 'Other')),
    category_source   text not null default 'llm'
                      check (category_source in ('llm', 'fallback', 'user')),
    is_anomaly        boolean not null default false,
    raw               jsonb not null default '{}',
    created_at        timestamptz not null default now()
);

-- every screen filters by user and date; summaries group by category within a window
create index transactions_user_date_idx on transactions (user_id, transaction_date desc);
create index transactions_user_category_idx on transactions (user_id, category, transaction_date);
-- chat and transaction search match merchants with ILIKE
create index transactions_description_trgm_idx on transactions using gin (description gin_trgm_ops);
create index transactions_statement_idx on transactions (statement_id);

create table payments (
    id            uuid primary key default gen_random_uuid(),
    user_id       text not null references profiles (id) on delete cascade,
    reference     text not null unique,
    plan_id       text not null check (plan_id in ('pro_month', 'pro_year')),
    amount_minor  bigint not null check (amount_minor > 0),
    currency      char(3) not null check (currency in ('NGN', 'USD')),
    status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'failed')),
    paid_at       timestamptz,
    payload       jsonb,
    created_at    timestamptz not null default now()
);

create index payments_user_status_idx on payments (user_id, status);
