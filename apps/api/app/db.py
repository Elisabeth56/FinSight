"""Postgres access: one small pool per process, plain SQL, rows as dicts."""

from collections.abc import Iterator
from contextlib import contextmanager

from psycopg import Connection
from psycopg.rows import DictRow, dict_row
from psycopg_pool import ConnectionPool

from app.config import settings

_pool: ConnectionPool[Connection[DictRow]] | None = None


def _get_pool() -> ConnectionPool[Connection[DictRow]]:
    global _pool
    if _pool is None:
        # serverless instances are short-lived, so keep the pool small and lazy
        _pool = ConnectionPool(
            settings.database_url,
            connection_class=Connection[DictRow],
            min_size=0,
            max_size=5,
            kwargs={"row_factory": dict_row},
            open=True,
        )
    return _pool


@contextmanager
def connect() -> Iterator[Connection[DictRow]]:
    """Yields a connection; commits on success, rolls back on error."""
    with _get_pool().connection() as conn:
        yield conn


def one(row: DictRow | None) -> DictRow:
    """For queries that always return a row (aggregates, INSERT ... RETURNING)."""
    if row is None:
        raise RuntimeError("expected exactly one row")
    return row


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
