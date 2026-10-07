import psycopg

from app.auth import User
from tests.conftest import TEST_DB, client_for, make_user


def test_me_reports_whether_this_is_the_demo_account():
    assert client_for(make_user("ada")).get("/me").json()["is_demo"] is False

    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute("insert into profiles (id, email) values ('demo', 'demo@finsight.app')")
    demo = User(id="demo", email="demo@finsight.app", full_name=None, pro_until=None)
    assert client_for(demo).get("/me").json()["is_demo"] is True


def test_changing_your_name_saves_it_trimmed():
    user = make_user("ada")
    res = client_for(user).patch("/me", json={"full_name": "  Ada Obi  "})
    assert res.status_code == 200
    assert res.json()["full_name"] == "Ada Obi"
    with psycopg.connect(TEST_DB) as conn:
        assert conn.execute("select full_name from profiles where id = 'ada'").fetchone() == (
            "Ada Obi",
        )


def test_a_blank_name_is_refused_in_the_shared_error_shape():
    res = client_for(make_user("ada")).patch("/me", json={"full_name": "   "})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "invalid_request"


def test_the_demo_account_cannot_be_renamed():
    with psycopg.connect(TEST_DB, autocommit=True) as conn:
        conn.execute(
            "insert into profiles (id, email, full_name)"
            " values ('demo', 'demo@finsight.app', 'Adaeze Okafor')"
        )
    demo = User(id="demo", email="demo@finsight.app", full_name="Adaeze Okafor", pro_until=None)
    res = client_for(demo).patch("/me", json={"full_name": "Someone else"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "demo_read_only"
    with psycopg.connect(TEST_DB) as conn:
        assert conn.execute("select full_name from profiles where id = 'demo'").fetchone() == (
            "Adaeze Okafor",
        )


def test_renaming_needs_a_session():
    assert client_for(None).patch("/me", json={"full_name": "Ada"}).status_code == 401
