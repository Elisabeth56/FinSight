from datetime import date

from app.features.chat import logic as chat
from app.features.reports import logic as reports
from tests.conftest import client_for, make_user, seed_demo


def test_bolt_question_gets_exact_sql_totals():
    user = make_user("asker")
    seed_demo(user.id)
    intent = chat.Intent(
        start_date=date(2026, 3, 1), end_date=date(2026, 3, 31), merchant="bolt", direction="out"
    )
    facts = chat.gather(user.id, "NGN", intent)

    assert facts.count == 14
    assert facts.total_minor == -48_600_00
    assert "Total spent: ₦48,600" in chat.describe(facts, intent)


def test_relative_dates_are_anchored_to_the_users_data():
    user = make_user("anchor")
    seed_demo(user.id)
    assert chat.latest_date(user.id) == date(2026, 3, 28)


def test_nothing_matching_says_so_instead_of_guessing():
    user = make_user("empty-search")
    seed_demo(user.id)
    intent = chat.Intent(merchant="nonexistent shop")
    facts = chat.gather(user.id, "NGN", intent)
    assert facts.count == 0
    assert "Nothing matched" in chat.describe(facts, intent)


def test_chat_streams_tokens_then_sources(monkeypatch):
    user = make_user("streamer")
    seed_demo(user.id)
    monkeypatch.setattr(chat, "extract_intent", lambda q, latest: chat.Intent(category="Transport"))

    async def fake_stream(**_):
        for word in ["You ", "spent ", "a lot."]:
            yield word

    monkeypatch.setattr(chat, "stream", fake_stream)
    res = client_for(user).post("/chat", json={"message": "transport?"})
    body = res.text

    assert body.count("event: token") == 3
    assert body.index("event: sources") > body.rindex("event: token")
    assert '"categories": ["Transport"]' in body
    assert body.rstrip().endswith("data: {}")


def test_chat_is_rate_limited_per_user(monkeypatch):
    user = make_user("chatty")
    monkeypatch.setattr(chat, "extract_intent", lambda q, latest: chat.Intent())

    async def fake_stream(**_):
        yield "ok"

    monkeypatch.setattr(chat, "stream", fake_stream)
    client = client_for(user)
    codes = [client.post("/chat", json={"message": "hi"}).status_code for _ in range(11)]
    assert codes[:10] == [200] * 10
    assert codes[10] == 429


def test_savings_amounts_are_computed_from_rows_not_the_model(monkeypatch):
    user = make_user("saver", pro=True)
    seed_demo(user.id)
    _, candidates = reports.spending_candidates(user.id)
    chowdeck = next(k for k, c in candidates.items() if c["name"] == "Chowdeck")

    def picks(**_):
        return reports.Picks(
            summary="Food delivery is your biggest lever.",
            opportunities=[
                reports.Pick(target=chowdeck, title="Cook more", description="d", cut_percent=40),
                reports.Pick(target="M99", title="Made up", description="d", cut_percent=50),
            ],
        )

    monkeypatch.setattr(reports, "generate_json", picks)
    body = client_for(user).post("/reports/savings").json()

    assert len(body["opportunities"]) == 1
    opp = body["opportunities"][0]
    expected = round(candidates[chowdeck]["monthly_minor"] * 0.4 / 10_000) * 10_000
    assert opp["saving_minor"] == expected
    assert body["total_saving_minor"] == expected


def test_savings_report_is_pro_only():
    res = client_for(make_user("free-saver")).post("/reports/savings")
    assert res.status_code == 402
    assert res.json()["error"]["code"] == "pro_required"
