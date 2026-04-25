"""
Auth dependency: verify Supabase JWT from the Authorization header
and load the current user from the public.users table.

Usage in any route:

    from core.auth import get_current_user

    @router.get("/me")
    def me(user: CurrentUser = Depends(get_current_user)):
        return user
"""

import logging
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from db.supabase import get_supabase_admin
from schemas.auth import CurrentUser

logger = logging.getLogger(__name__)

# auto_error=False → we return our own 401 so the error shape stays consistent
bearer_scheme = HTTPBearer(auto_error=False)

_ASYMMETRIC_ALGS = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "EdDSA"}
_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url)
    return _jwks_client


def _decode_supabase_jwt(token: str) -> dict:
    """
    Supabase may sign JWTs with HS256 (legacy JWT secret) or with an asymmetric
    algorithm (new JWT signing keys, verified via JWKS). Pick the right path
    based on the token header.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg in _ASYMMETRIC_ALGS:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token).key
            return jwt.decode(
                token,
                signing_key,
                algorithms=[alg],
                audience="authenticated",
            )

        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid JWT: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = _decode_supabase_jwt(token)

    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token",
        )

    # Pull profile row. Using admin client here because the row was created
    # by a trigger (service-level) and we already trust the JWT.
    admin = get_supabase_admin()
    result = (
        admin.table("users")
        .select("id, email, full_name, avatar_url, plan, created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        # First-login edge case: the trigger usually handles this, but
        # fall back to creating the profile row if it's missing.
        admin.table("users").insert(
            {"id": user_id, "email": email}
        ).execute()
        profile = {"id": user_id, "email": email, "plan": "free"}
    else:
        profile = result.data[0]

    return CurrentUser(**profile, access_token=token)
