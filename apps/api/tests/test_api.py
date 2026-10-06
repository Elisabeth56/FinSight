from pathlib import Path

import psycopg

from app.features.statements import logic as statements_logic
from tests.conftest import TEST_DB, client_for, make_user, seed_demo

FIXTURES = Path(__file__).parent / "fixtures"


def test_requests_without_a_token_get_the_shared_error_shape():
    res = client_for(None).get("/me")
    assert res.status_code == 401
    assert res.json() == {
        "error": {"code": "not_signed_in", "message": "Sign in to continue.", "details": {}}
    }


def test_summary_matches_the_demo_figures():
    user = make_user("demo")
    seed_demo(user.id)
    body = client_for(user).get("/analytics/summary").json()

    assert body["month"] == "2026-03"
    assert body["currency"] == "NGN"
    assert body["spent_minor"] == 284_500_00
    assert body["income_minor"] == 410_000_00
    assert body["previous_spent_minor"] == 315_700_00
    assert body["by_category"][0] == {
        "category": "Food & Dining",
        "total_minor": 92_300_00,
        "count": 12,
    }
    assert body["anomaly_count"] == 2
    assert [m["month"] for m in body["monthly"]] == ["2026-01", "2026-02", "2026-03"]


def test_summary_keeps_currencies_apart():
    user = make_user("two-currencies")
    seed_demo(user.id)
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        sid = conn.execute(
            "insert into statements (user_id, filename, file_type, file_sha256, currency)"
            " values (%s, 'usd.csv', 'csv', 'abc', 'USD') returning id",
            (user.id,),
        ).fetchone()[0]
        conn.execute(
            "insert into transactions (user_id, statement_id, transaction_date, description,"
            " amount_minor, currency, category) values (%s, %s, '2026-03-10', 'NETFLIX', -1500,"
            " 'USD', 'Entertainment')",
            (user.id, sid),
        )
    client = client_for(user)
    ngn = client.get("/analytics/summary").json()
    usd = client.get("/analytics/summary?currency=USD").json()

    assert ngn["spent_minor"] == 284_500_00
    assert usd["spent_minor"] == 15_00
    assert ngn["currencies"] == ["NGN", "USD"]


def test_summary_is_not_capped_at_1000_rows():
    user = make_user("busy")
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        sid = conn.execute(
            "insert into statements (user_id, filename, file_type, file_sha256, currency)"
            " values (%s, 'big.csv', 'csv', 'big', 'NGN') returning id",
            (user.id,),
        ).fetchone()[0]
        with conn.cursor() as cur:
            cur.executemany(
                "insert into transactions (user_id, statement_id, transaction_date, description,"
                " amount_minor, currency, category) values (%s, %s, '2026-03-01', 'POS', -100,"
                " 'NGN', 'Other')",
                [(user.id, sid)] * 2500,
            )
    body = client_for(user).get("/analytics/summary").json()
    assert body["spent_minor"] == 2500 * 100
    assert body["transaction_count"] == 2500


def test_users_only_see_their_own_transactions():
    owner, other = make_user("owner"), make_user("other")
    seed_demo(owner.id)

    assert client_for(other).get("/transactions").json()["total"] == 0
    assert client_for(owner).get("/transactions").json()["total"] == 116

    statement_id = client_for(owner).get("/statements").json()[0]["id"]
    res = client_for(other).delete(f"/statements/{statement_id}")
    assert res.status_code == 404


def test_transaction_filters_and_search():
    user = make_user("searcher")
    seed_demo(user.id)
    client = client_for(user)

    bolt = client.get("/transactions?month=2026-03&search=bolt&limit=200").json()
    assert bolt["total"] == 14
    flagged = client.get("/transactions?month=2026-03&flagged=true").json()
    assert {t["merchant"] for t in flagged["transactions"]} == {"Jumia", "HealthPlus Pharmacy"}

    bad = client.get("/transactions?month=March")
    assert bad.status_code == 422
    assert bad.json()["error"]["code"] == "invalid_month"


def test_deleting_a_statement_removes_its_rows():
    user = make_user("deleter")
    seed_demo(user.id)
    client = client_for(user)
    march = next(s for s in client.get("/statements").json() if "march" in s["filename"])

    assert client.delete(f"/statements/{march['id']}").status_code == 204
    assert client.get("/transactions?month=2026-03").json()["total"] == 0


def test_csv_upload_stores_rows_and_rejects_the_same_file_twice(monkeypatch):
    monkeypatch.setattr(
        statements_logic, "categorize_all", lambda txs: ["Groceries"] * len(list(txs))
    )
    user = make_user("uploader", pro=True)
    client = client_for(user)
    csv = (FIXTURES / "gtbank_march.csv").read_bytes()

    res = client.post("/statements", files={"file": ("gtbank_march.csv", csv, "text/csv")})
    assert res.status_code == 201, res.text
    assert res.json()["row_count"] == 5

    rows = client.get("/transactions").json()["transactions"]
    assert (
        sum(r["amount_minor"] for r in rows)
        == -12_450_00 - 2_000_00 + 45_000_00 - 3_800_00 - 6_200_50
    )

    again = client.post("/statements", files={"file": ("gtbank_march.csv", csv, "text/csv")})
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "already_uploaded"


def test_free_plan_gets_one_upload_a_month(monkeypatch):
    monkeypatch.setattr(statements_logic, "categorize_all", lambda txs: ["Other"] * len(list(txs)))
    client = client_for(make_user("free"))
    csv = (FIXTURES / "gtbank_march.csv").read_bytes()

    assert client.post("/statements", files={"file": ("a.csv", csv, "text/csv")}).status_code == 201
    second = client.post("/statements", files={"file": ("b.csv", csv + b"\n", "text/csv")})
    assert second.status_code == 402
    assert second.json()["error"]["code"] == "upload_quota_reached"


def test_oversized_upload_is_refused_with_a_plain_message():
    client = client_for(make_user("big-file", pro=True))
    res = client.post(
        "/statements", files={"file": ("x.csv", b"a" * (4 * 1024 * 1024 + 1), "text/csv")}
    )
    assert res.status_code == 413
    assert "4 MB" in res.json()["error"]["message"]
