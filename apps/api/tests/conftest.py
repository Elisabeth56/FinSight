"""Tests run against a real Postgres (TEST_DATABASE_URL), migrated fresh and emptied between tests.
Only the network boundary is faked: auth tokens and the LLM."""

import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

import psycopg
import pytest

TEST_DB = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres@localhost:5433/finsight_test?host=/tmp"
)
os.environ["DATABASE_URL"] = TEST_DB
os.environ.setdefault("APP_ENV", "development")

from fastapi.testclient import TestClient  # noqa: E402

from app.auth import User, current_user  # noqa: E402
from app.main import app  # noqa: E402
from scripts.seed_data import demo_statements  # noqa: E402

MIGRATIONS = Path(__file__).resolve().parents[3] / "db" / "migrations"


@pytest.fixture(scope="session", autouse=True)
def schema():
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute("drop schema public cascade; create schema public")
        for path in sorted(MIGRATIONS.glob("*.sql")):
            conn.execute(path.read_text())


@pytest.fixture(autouse=True)
def clean():
    yield
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute("truncate profiles cascade")


def make_user(user_id: str, pro: bool = False) -> User:
    pro_until = datetime.now(UTC) + timedelta(days=30) if pro else None
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute(
            "insert into profiles (id, email, pro_until) values (%s, %s, %s)",
            (user_id, f"{user_id}@example.com", pro_until),
        )
    return User(id=user_id, email=f"{user_id}@example.com", full_name=None, pro_until=pro_until)


def client_for(user: User | None) -> TestClient:
    app.dependency_overrides.clear()
    if user is not None:
        app.dependency_overrides[current_user] = lambda: user
    return TestClient(app)


def seed_demo(user_id: str) -> None:
    """Loads the demo account's three months for user_id."""
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        for stmt in demo_statements():
            sid = conn.execute(
                "insert into statements (user_id, filename, file_type, file_sha256, status,"
                " currency, row_count) values (%s, %s, 'pdf', %s, 'ready', 'NGN', %s) returning id",
                (user_id, stmt.filename, stmt.fingerprint, len(stmt.rows)),
            ).fetchone()[0]
            with conn.cursor() as cur:
                cur.executemany(
                    "insert into transactions (user_id, statement_id, transaction_date,"
                    " description, merchant, amount_minor, currency, category, is_anomaly)"
                    " values (%s, %s, %s, %s, %s, %s, 'NGN', %s, %s)",
                    [
                        (
                            user_id,
                            sid,
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
