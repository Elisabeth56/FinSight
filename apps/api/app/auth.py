"""Who is calling: verifies the Neon Auth JWT and loads (or creates) the caller's profile."""

from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.db import connect, one
from app.errors import AppError

# auto_error=False so a missing token gets our error shape, not FastAPI's
bearer = HTTPBearer(auto_error=False)

ASYMMETRIC = ["RS256", "ES256", "EdDSA"]


@dataclass
class User:
    id: str
    email: str
    full_name: str | None
    pro_until: datetime | None

    @property
    def is_pro(self) -> bool:
        return self.pro_until is not None and self.pro_until > datetime.now(UTC)


@lru_cache
def _jwks() -> jwt.PyJWKClient:
    if not settings.auth_jwks_url:
        raise AppError(500, "auth_not_configured", "Sign-in isn't set up on this server yet.")
    return jwt.PyJWKClient(settings.auth_jwks_url, cache_keys=True)


def decode_token(token: str) -> dict:
    """Returns the token's claims, or raises a 401 AppError."""
    try:
        key = _jwks().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            key,
            algorithms=ASYMMETRIC,
            audience=settings.auth_audience or None,
            options={"verify_aud": bool(settings.auth_audience)},
        )
    except jwt.ExpiredSignatureError:
        raise AppError(401, "session_expired", "Your session ended. Sign in again.") from None
    except jwt.PyJWTError:
        raise AppError(401, "not_signed_in", "Sign in to continue.") from None


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppError(401, "not_signed_in", "Sign in to continue.")

    claims = decode_token(credentials.credentials)
    user_id, email = claims.get("sub"), claims.get("email")
    if not user_id or not email:
        raise AppError(401, "not_signed_in", "Sign in to continue.")

    # first request from a new account creates its profile
    with connect() as conn:
        row = one(
            conn.execute(
                "insert into profiles (id, email, full_name) values (%s, %s, %s)"
                " on conflict (id) do update set email = excluded.email"
                " returning id, email, full_name, pro_until",
                (user_id, email, claims.get("name")),
            ).fetchone()
        )
    return User(**row)


CurrentUser = Annotated[User, Depends(current_user)]
