"""Database tasks: apply migrations in order and load the demo account.

Usage:
    uv run python -m scripts.db migrate
    uv run python -m scripts.db seed
Reads DATABASE_URL from the environment (or apps/api/.env).
"""

import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

from scripts.seed_data import DEMO_EMAIL, DEMO_NAME, demo_statements

MIGRATIONS = Path(__file__).resolve().parents[3] / "db" / "migrations"


def connect() -> psycopg.Connection:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set")
    return psycopg.connect(url)


def migrate() -> None:
    """Applies every migration file not yet recorded in schema_migrations."""
    with connect() as conn:
        conn.execute(
            "create table if not exists schema_migrations ("
            " name text primary key, applied_at timestamptz not null default now())"
        )
        done = {row[0] for row in conn.execute("select name from schema_migrations")}
        for path in sorted(MIGRATIONS.glob("*.sql")):
            if path.name in done:
                continue
            # each file and its record commit together, so a failed file can be rerun
            with conn.transaction():
                conn.execute(path.read_text())
                conn.execute("insert into schema_migrations (name) values (%s)", (path.name,))
            print(f"applied {path.name}")


def seed() -> None:
    """Replaces the demo account's data with the fixed three-month story."""
    user_id = os.environ.get("DEMO_USER_ID", "demo-user")
    with connect() as conn, conn.transaction():
        conn.execute(
            "insert into profiles (id, email, full_name) values (%s, %s, %s)"
            " on conflict (id) do update"
            " set email = excluded.email, full_name = excluded.full_name",
            (user_id, DEMO_EMAIL, DEMO_NAME),
        )
        conn.execute("delete from statements where user_id = %s", (user_id,))

        for stmt in demo_statements():
            statement_id = conn.execute(
                "insert into statements (user_id, filename, file_type, file_sha256, status,"
                " currency, period_start, period_end, row_count)"
                " values (%s, %s, 'pdf', %s, 'ready', 'NGN', %s, %s, %s) returning id",
                (
                    user_id,
                    stmt.filename,
                    stmt.fingerprint,
                    stmt.period_start,
                    stmt.period_end,
                    len(stmt.rows),
                ),
            ).fetchone()[0]
            with conn.cursor() as cur:
                cur.executemany(
                    "insert into transactions (user_id, statement_id, transaction_date,"
                    " description, merchant, amount_minor, currency, category, is_anomaly)"
                    " values (%s, %s, %s, %s, %s, %s, 'NGN', %s, %s)",
                    [
                        (
                            user_id,
                            statement_id,
                            r.date,
                            r.description,
                            r.merchant,
                            r.amount_minor,
                            r.category,
                            r.is_anomaly,
                        )
                        for r in stmt.rows
                    ],
                )
            print(f"seeded {stmt.filename}: {len(stmt.rows)} rows")


if __name__ == "__main__":
    commands = {"migrate": migrate, "seed": seed}
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        sys.exit("usage: python -m scripts.db [migrate|seed]")
    commands[sys.argv[1]]()
