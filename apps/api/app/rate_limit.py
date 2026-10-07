"""Per-user limits on AI endpoints, so one person can't use up the shared free LLM quota."""

from app.db import connect, one
from app.errors import AppError


def limit(user_id: str, kind: str, per_minute: int) -> None:
    """Records this request, or raises 429 once the user has made `per_minute` in a minute."""
    with connect() as conn:
        recent = one(
            conn.execute(
                "select count(*) as n from ai_requests"
                " where user_id = %s and kind = %s and created_at > now() - interval '1 minute'",
                (user_id, kind),
            ).fetchone()
        )["n"]
        if recent >= per_minute:
            raise AppError(
                429, "slow_down", "That's a lot of questions at once. Try again in a minute."
            )
        conn.execute("insert into ai_requests (user_id, kind) values (%s, %s)", (user_id, kind))
        conn.execute(
            "delete from ai_requests where user_id = %s and created_at < now() - interval '1 day'",
            (user_id,),
        )
