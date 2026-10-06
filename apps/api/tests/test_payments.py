from datetime import UTC, datetime, timedelta

import psycopg
import pytest

from app.config import settings
from app.features.payments import paystack
from tests.conftest import TEST_DB, client_for, make_user, seed_demo


@pytest.fixture
def fake_paystack(monkeypatch):
    """Paystack is the network boundary: record checkouts, answer verifies from a dict."""
    monkeypatch.setattr(settings, "paystack_secret_key", "sk_test")
    outcomes: dict[str, dict] = {}
    monkeypatch.setattr(
        paystack, "initialize", lambda **kw: f"https://checkout.test/{kw['reference']}"
    )
    monkeypatch.setattr(paystack, "verify", lambda ref: outcomes[ref])
    return outcomes


def pro_until(user_id: str):
    with psycopg.connect(TEST_DB) as conn:
        return conn.execute("select pro_until from profiles where id = %s", (user_id,)).fetchone()[
            0
        ]


def test_a_verified_month_pass_makes_the_user_pro_for_30_days(fake_paystack):
    user = make_user("buyer")
    client = client_for(user)
    ref = client.post("/payments", json={"plan_id": "pro_month"}).json()["reference"]
    fake_paystack[ref] = {"status": "success", "amount": 450_000, "currency": "NGN"}

    body = client.post(f"/payments/{ref}/verify").json()
    assert body["status"] == "paid"
    days = (pro_until(user.id) - datetime.now(UTC)).days
    assert days in (29, 30)


def test_verifying_twice_does_not_extend_pro_twice(fake_paystack):
    user = make_user("double-tab")
    client = client_for(user)
    ref = client.post("/payments", json={"plan_id": "pro_month"}).json()["reference"]
    fake_paystack[ref] = {"status": "success", "amount": 450_000, "currency": "NGN"}

    client.post(f"/payments/{ref}/verify")
    first = pro_until(user.id)
    client.post(f"/payments/{ref}/verify")
    assert pro_until(user.id) == first


def test_a_wrong_amount_is_not_accepted_as_paid(fake_paystack):
    user = make_user("tamper")
    client = client_for(user)
    ref = client.post("/payments", json={"plan_id": "pro_year"}).json()["reference"]
    fake_paystack[ref] = {"status": "success", "amount": 100, "currency": "NGN"}

    assert client.post(f"/payments/{ref}/verify").json()["status"] == "failed"
    assert pro_until(user.id) is None


def test_an_abandoned_checkout_stays_pending_and_is_listed_for_healing(fake_paystack):
    user = make_user("closed-tab")
    client = client_for(user)
    ref = client.post("/payments", json={"plan_id": "pro_month", "currency": "USD"}).json()[
        "reference"
    ]
    fake_paystack[ref] = {"status": "abandoned", "amount": 500, "currency": "USD"}

    assert client.post(f"/payments/{ref}/verify").json()["status"] == "pending"
    assert client.get("/payments/pending").json() == [ref]


def test_expired_pro_is_treated_as_free():
    user = make_user("lapsed")
    seed_demo(user.id)
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute(
            "update profiles set pro_until = %s where id = %s",
            (datetime.now(UTC) - timedelta(days=1), user.id),
        )
    lapsed = user.__class__(**{**user.__dict__, "pro_until": datetime.now(UTC) - timedelta(days=1)})
    me = client_for(lapsed).get("/me").json()
    assert me["is_pro"] is False
    assert me["upload_limit"] == 1
    assert client_for(lapsed).post("/reports/savings").status_code == 402


def test_someone_elses_payment_reference_is_not_found(fake_paystack):
    owner, other = make_user("payer"), make_user("snoop")
    ref = client_for(owner).post("/payments", json={"plan_id": "pro_month"}).json()["reference"]
    res = client_for(other).post(f"/payments/{ref}/verify")
    assert res.status_code == 404
