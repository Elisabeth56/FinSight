"""Real Ed25519-signed tokens through current_user; only the JWKS download is faked."""

import time
from types import SimpleNamespace

import httpx
import jwt
import psycopg
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi.testclient import TestClient

from app import auth
from app.main import app
from scripts import db
from tests.conftest import TEST_DB

AUDIENCE = "https://ep-test.neonauth.example"
KEY = Ed25519PrivateKey.generate()


@pytest.fixture(autouse=True)
def jwks(monkeypatch):
    signing_key = SimpleNamespace(key=KEY.public_key())
    monkeypatch.setattr(
        auth, "_jwks", lambda: SimpleNamespace(get_signing_key_from_jwt=lambda _: signing_key)
    )
    monkeypatch.setattr(auth.settings, "auth_audience", AUDIENCE)
    app.dependency_overrides.clear()


def token(key=KEY, ttl=900, **claims) -> str:
    now = int(time.time())
    body = {
        "sub": "user-a",
        "email": "a@example.com",
        "aud": AUDIENCE,
        "iat": now,
        "exp": now + ttl,
    }
    return jwt.encode({**body, **claims}, key, algorithm="EdDSA")


def get_me(bearer: str) -> httpx.Response:
    return TestClient(app).get("/me", headers={"Authorization": f"Bearer {bearer}"})


def test_a_valid_token_signs_in_and_creates_the_profile():
    res = get_me(token(name="Ada"))
    assert res.status_code == 200
    with psycopg.connect(TEST_DB) as conn:
        row = conn.execute("select email, full_name from profiles where id = 'user-a'").fetchone()
    assert row == ("a@example.com", "Ada")


def test_an_expired_token_says_the_session_ended():
    res = get_me(token(ttl=-60))
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "session_expired"


@pytest.mark.parametrize(
    "bad",
    [
        token()[:-4] + "AAAA",  # tampered signature
        token(key=Ed25519PrivateKey.generate()),  # signed by someone else
        token(aud="https://another-app.example"),  # meant for another app
        "not-a-jwt",
    ],
)
def test_bad_tokens_get_401_in_the_shared_error_shape(bad):
    res = get_me(bad)
    assert res.status_code == 401
    assert res.json() == {
        "error": {"code": "not_signed_in", "message": "Sign in to continue.", "details": {}}
    }


def test_seed_signs_up_the_demo_user_the_first_time(monkeypatch):
    monkeypatch.setenv("NEON_AUTH_BASE_URL", "https://auth.example/neondb/auth")
    monkeypatch.setenv("DEMO_PASSWORD", "demo-password")
    monkeypatch.delenv("FRONTEND_ORIGIN", raising=False)
    calls = []

    def post(url, json, headers, timeout):
        assert headers == {"Origin": "http://localhost:3000"}
        calls.append(url.rsplit("/", 2)[-2:])
        if url.endswith("/sign-in/email"):
            return httpx.Response(401, request=httpx.Request("POST", url))
        return httpx.Response(
            200, json={"user": {"id": "neon-demo-id"}}, request=httpx.Request("POST", url)
        )

    monkeypatch.setattr(db.httpx, "post", post)
    assert db.demo_user_id() == "neon-demo-id"
    assert calls == [["sign-in", "email"], ["sign-up", "email"]]
