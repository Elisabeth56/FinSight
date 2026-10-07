"""The eval judge: expected figures come from SQL, and naira can be written several ways."""

import importlib.util
from pathlib import Path

from tests.conftest import TEST_DB, make_user, seed_demo

RUNNER = Path(__file__).resolve().parents[3] / "evals" / "run.py"


def load_runner():
    spec = importlib.util.spec_from_file_location("eval_run", RUNNER)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.DB_URL = TEST_DB
    return module


def test_figure_answers_pass_only_with_the_sql_amount():
    runner = load_runner()
    make_user(runner.EVAL_USER)
    seed_demo(runner.EVAL_USER)
    case = {
        "expect": "figure",
        "start": "2026-03-01",
        "end": "2026-03-31",
        "measure": "spent",
        "name": "bolt",
    }

    assert runner.expected_minor(case) == 4_860_000
    assert runner.judge(case, "You spent ₦48,600 on 14 Bolt rides.")
    assert runner.judge(case, "That comes to N48,600.")
    assert not runner.judge(case, "About ₦50,000 on Bolt.")


def test_unanswerable_questions_pass_only_without_an_amount():
    runner = load_runner()
    case = {"expect": "no_figure"}

    assert runner.judge(case, "I don't see any Netflix payments in your statements.")
    assert not runner.judge(case, "You spent NGN 7,000 on Netflix.")
