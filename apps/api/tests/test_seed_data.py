from collections import Counter, defaultdict

from scripts.seed_data import demo_statements


def march():
    return demo_statements()[2].rows


def test_march_totals_match_the_designs():
    rows = march()
    spent = -sum(r.amount_minor for r in rows if r.amount_minor < 0)
    money_in = sum(r.amount_minor for r in rows if r.amount_minor > 0)
    assert spent == 284_500_00
    assert money_in == 410_000_00


def test_march_categories_match_the_designs():
    by_category = defaultdict(int)
    for r in march():
        if r.amount_minor < 0:
            by_category[r.category] -= r.amount_minor
    assert by_category["Food & Dining"] == 92_300_00
    assert by_category["Transport"] == 48_600_00
    assert by_category["Bills & Utilities"] == 37_900_00
    assert by_category["Groceries"] == 30_400_00


def test_march_has_fourteen_bolt_rides_and_two_flags():
    rows = march()
    assert Counter(r.merchant for r in rows)["Bolt"] == 14
    assert sum(r.is_anomaly for r in rows) == 2


def test_february_spent_is_31200_more_than_march():
    feb = demo_statements()[1].rows
    spent = -sum(r.amount_minor for r in feb if r.amount_minor < 0)
    assert spent == 315_700_00
