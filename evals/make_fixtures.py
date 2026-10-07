"""Builds the parsing fixtures from the demo seed, so expected counts and totals never drift.

Run from apps/api:  uv run python ../../evals/make_fixtures.py
Writes evals/fixtures/* and evals/parsing.jsonl.
"""

import csv
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))  # apps/api, for scripts.seed_data

from scripts.seed_data import Row, demo_statements  # noqa: E402

HERE = Path(__file__).parent
FIXTURES = HERE / "fixtures"
OPENING_KOBO = 25_000_000


def naira(kobo: int) -> str:
    return f"{abs(kobo) / 100:,.2f}"


def gtbank_csv(rows: list[Row]) -> str:
    """Trans. Date, Narration, Debit, Credit, Balance; dates like 14-Mar-2026."""
    out, balance = io.StringIO(), OPENING_KOBO
    writer = csv.writer(out)
    writer.writerow(["Trans. Date", "Narration", "Debit", "Credit", "Balance"])
    for r in rows:
        balance += r.amount_minor
        debit = naira(r.amount_minor) if r.amount_minor < 0 else ""
        credit = naira(r.amount_minor) if r.amount_minor > 0 else ""
        writer.writerow([r.date.strftime("%d-%b-%Y"), r.description, debit, credit, naira(balance)])
    return out.getvalue()


def access_csv(rows: list[Row]) -> str:
    """Date (dd/mm/yyyy), Description, signed Amount; a quarter in one file."""
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Date", "Description", "Amount"])
    for r in rows:
        writer.writerow([r.date.strftime("%d/%m/%Y"), r.description, f"{r.amount_minor / 100:.2f}"])
    return out.getvalue()


def opay_lines(rows: list[Row]) -> list[str]:
    """OPay-style text rows. Every third row wraps its narration onto a second line."""
    lines = [
        "OPay Digital Services Limited",
        "Account Statement  Adaeze Okafor  Wallet 81xxxxxx42",
        "Trans. Time  Value Date  Description  Debit  Credit  Balance After  Channel  Reference",
    ]
    balance = OPENING_KOBO
    for i, r in enumerate(rows):
        balance += r.amount_minor
        day = r.date.strftime("%d %b %Y")
        debit = naira(r.amount_minor) if r.amount_minor < 0 else "--"
        credit = naira(r.amount_minor) if r.amount_minor > 0 else "--"
        tail = f"{debit} {credit} {naira(balance)} Mobile 2603{i:06d}"
        start = f"{day} 08:{i % 60:02d}:00 {day}"
        words = r.description.split("/")
        if i % 3 == 2 and len(words) > 1:
            lines += [f"{start} {words[0]}/", f"{'/'.join(words[1:])} {tail}"]
        else:
            lines.append(f"{start} {r.description} {tail}")
    return lines


def pdf(lines: list[str]) -> bytes:
    """A minimal text-only PDF (Helvetica, A4 landscape, 50 lines a page). No dependencies."""
    pages = [lines[i : i + 50] for i in range(0, len(lines), 50)]
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    kids = []
    for page in pages:
        text = "".join(
            f"BT /F1 8 Tf 30 {560 - 11 * n} Td ({_escape(line)}) Tj ET\n"
            for n, line in enumerate(page)
        )
        objects.append(f"<< /Length {len(text)} >>\nstream\n{text}endstream")
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents {len(objects)} 0 R"
            " /Resources << /Font << /F1 3 0 R >> >> >>"
        )
        kids.append(f"{len(objects)} 0 R")
    objects[1] = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(kids)} >>"
    return _assemble(objects)


def _escape(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .encode("latin-1", "replace")
        .decode("latin-1")
    )


def _assemble(objects: list[str]) -> bytes:
    body, offsets = b"%PDF-1.4\n", []
    for n, obj in enumerate(objects, start=1):
        offsets.append(len(body))
        body += f"{n} 0 obj\n{obj}\nendobj\n".encode("latin-1")
    xref = len(body)
    body += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    body += "".join(f"{o:010d} 00000 n \n" for o in offsets).encode()
    body += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    return body


def main() -> None:
    january, february, march = (s.rows for s in demo_statements())
    quarter = [*january, *february, *march]
    fixtures = {
        "gtbank_march.csv": (gtbank_csv(march).encode(), march),
        "access_q1.csv": (access_csv(quarter).encode(), quarter),
        "opay_march.pdf": (pdf(opay_lines(march)), march),
    }
    FIXTURES.mkdir(exist_ok=True)
    with open(HERE / "parsing.jsonl", "w") as cases:
        for name, (data, rows) in fixtures.items():
            (FIXTURES / name).write_bytes(data)
            expected = {
                "file": name,
                "rows": len(rows),
                "total_minor": sum(r.amount_minor for r in rows),
                "currency": "NGN",
            }
            cases.write(json.dumps(expected) + "\n")
            print(name, expected)


if __name__ == "__main__":
    main()
