"""The demo account: three months of made-up Lagos spending that matches the designs.

March is spelled out row by row because the landing page and screens quote it
(₦284,500 spent, ₦410,000 in, Food ₦92,300, 14 Bolt rides for ₦48,600, two
highlighted charges). January and February are spread from category totals.
"""

import hashlib
from dataclasses import dataclass
from datetime import date

DEMO_EMAIL = "demo@finsight.app"
DEMO_NAME = "Adaeze Okafor"


@dataclass
class Row:
    date: date
    description: str
    merchant: str
    amount_minor: int
    category: str
    is_anomaly: bool = False


@dataclass
class Statement:
    filename: str
    period_start: date
    period_end: date
    rows: list[Row]

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(f"demo:{self.filename}".encode()).hexdigest()


def naira(amount: int) -> int:
    """Whole naira to kobo."""
    return amount * 100


# (day, narration as printed, readable merchant, naira, category); negative = money out
MARCH = [
    (1, "POS/CAFE NEO/VI/2203", "Café Neo", -5000, "Food & Dining"),
    (2, "WEB/BOLT.EU/O/2603020812", "Bolt", -3800, "Transport"),
    (3, "WEB/CHOWDECK ORDER 55120", "Chowdeck", -8750, "Food & Dining"),
    (3, "USSD/AIRTIME/MTN/0803XXX1123", "MTN airtime", -2000, "Bills & Utilities"),
    (4, "WEB/BOLT.EU/O/2603040731", "Bolt", -4100, "Transport"),
    (5, "POS/CHICKEN REP/IKEJA", "Chicken Republic", -6200, "Food & Dining"),
    (5, "WEB/IKEJA ELECTRIC PREPAID", "Ikeja Electric", -15000, "Bills & Utilities"),
    (6, "WEB/BOLT.EU/O/2603060745", "Bolt", -2900, "Transport"),
    (7, "WEB/CHOWDECK ORDER 55871", "Chowdeck", -9200, "Food & Dining"),
    (8, "TRF/NIP/FBN/OKONKWO C/09203941", "Transfer to Chidi Okonkwo", -20000, "Transfers"),
    (8, "WEB/BOLT.EU/O/2603081902", "Bolt", -3500, "Transport"),
    (9, "WEB/DSTV SUBSCRIPTION", "DStv", -12500, "Bills & Utilities"),
    (10, "WEB/BOLT.EU/O/2603100718", "Bolt", -4600, "Transport"),
    (10, "WEB/CHOWDECK ORDER 56340", "Chowdeck", -7800, "Food & Dining"),
    (11, "POS/HEALTHPLUS PHARM/LEKKI", "HealthPlus Pharmacy", -6800, "Health"),
    (12, "POS/SPAR LEKKI PH1/LA/2341887", "Spar, Lekki Phase 1", -17950, "Groceries"),
    (12, "WEB/BOLT.EU/O/2603120802", "Bolt", -3200, "Transport"),
    (13, "WEB/SPOTIFY P1A2B3", "Spotify", -2950, "Bills & Utilities"),
    (14, "POS PURCHASE SHOPRITE LEKKI", "Shoprite, Lekki", -12450, "Groceries"),
    (14, "WEB/BOLT.EU/O/2603141822", "Bolt", -2700, "Transport"),
    (14, "WEB/CHOWDECK ORDER 56902", "Chowdeck", -10400, "Food & Dining"),
    (15, "TRF/NIP/GTB/ADAEZE O/77120344", "Transfer from Adaeze O.", 45000, "Income"),
    (16, "WEB/BOLT.EU/O/2603160655", "Bolt", -3900, "Transport"),
    (17, "POS/CHICKEN REP/LEKKI", "Chicken Republic", -5800, "Food & Dining"),
    (17, "USSD/DATA/GLO/0805XXX4410", "Glo data", -3550, "Bills & Utilities"),
    (18, "WEB/BOLT.EU/O/2603180740", "Bolt", -3300, "Transport"),
    (19, "WEB/CHOWDECK ORDER 57511", "Chowdeck", -8100, "Food & Dining"),
    (20, "WEB/APPLE.COM/BILL ICLOUD", "iCloud", -1900, "Bills & Utilities"),
    (20, "WEB/BOLT.EU/O/2603202015", "Bolt", -4200, "Transport"),
    (21, "POS/FILMHOUSE LEKKI", "Filmhouse, Lekki", -3500, "Entertainment"),
    (21, "POS/CHICKEN REP/VI", "Chicken Republic", -7100, "Food & Dining"),
    (22, "WEB/BOLT.EU/O/2603220811", "Bolt", -3100, "Transport"),
    (23, "WEB/CHOWDECK ORDER 58003", "Chowdeck", -9650, "Food & Dining"),
    (24, "WEB/BOLT.EU/O/2603240722", "Bolt", -2800, "Transport"),
    (24, "TRF/NIP/UBA/KEMI A/33019822", "Transfer from Kemi A.", 15000, "Income"),
    (25, "WEB/CHOWDECK ORDER 58460", "Chowdeck", -7900, "Food & Dining"),
    (26, "SAL/MAR26/TECHNEST LTD/PAY", "Salary from Technest", 350000, "Income"),
    (26, "WEB/BOLT.EU/O/2603260745", "Bolt", -3600, "Transport"),
    (27, "POS/CHICKEN REP/IKEJA", "Chicken Republic", -6400, "Food & Dining"),
    (28, "WEB/JMIA*ORDER 88213/NG", "Jumia", -45000, "Shopping"),
    (28, "WEB/BOLT.EU/O/2603281904", "Bolt", -2900, "Transport"),
]

# rows the anomaly detector would flag in March: Jumia is ~3x the usual Shopping charge,
# the pharmacy run is far above the usual Health spend
MARCH_ANOMALIES = {"WEB/JMIA*ORDER 88213/NG", "POS/HEALTHPLUS PHARM/LEKKI"}

# category totals in naira and the merchants that make them up
FEBRUARY = {
    "Food & Dining": (118000, ["Chowdeck"] * 10 + ["Chicken Republic"] * 4),
    "Transport": (46200, ["Bolt"] * 13),
    "Bills & Utilities": (37900, ["Ikeja Electric", "DStv", "Spotify", "iCloud", "MTN airtime"]),
    "Groceries": (34800, ["Shoprite, Lekki", "Spar, Lekki Phase 1"]),
    "Shopping": (14800, ["Jumia"]),
    "Transfers": (40000, ["Transfer to Chidi Okonkwo", "Transfer to Mum"]),
    "Entertainment": (7000, ["Filmhouse, Lekki"]),
    "Health": (2000, ["HealthPlus Pharmacy"]),
    "Other": (15000, ["Barber, Lekki"]),
    "Income": (-350000, ["Salary from Technest"]),
}

JANUARY = {
    "Food & Dining": (85000, ["Chowdeck"] * 7 + ["Chicken Republic"] * 3),
    "Transport": (41000, ["Bolt"] * 12),
    "Bills & Utilities": (37900, ["Ikeja Electric", "DStv", "Spotify", "iCloud", "MTN airtime"]),
    "Groceries": (28600, ["Shoprite, Lekki", "Spar, Lekki Phase 1"]),
    "Shopping": (16200, ["Jumia"]),
    "Transfers": (30000, ["Transfer to Chidi Okonkwo"]),
    "Entertainment": (5000, ["Filmhouse, Lekki"]),
    "Health": (2300, ["HealthPlus Pharmacy"]),
    "Income": (-350000, ["Salary from Technest"]),
}


def spread(year: int, month: int, totals: dict[str, tuple[int, list[str]]]) -> list[Row]:
    """Splits each category total across its merchants on dates spread through the month."""
    rows: list[Row] = []
    for category, (total, merchants) in totals.items():
        share, remainder = divmod(abs(total), len(merchants))
        for i, merchant in enumerate(merchants):
            amount = share + (remainder if i == len(merchants) - 1 else 0)
            day = 1 + (i * 27 // len(merchants) + len(rows)) % 27
            # totals are spending, so they go out as negatives; income totals are stored negated
            sign = 1 if total < 0 else -1
            rows.append(
                Row(
                    date(year, month, day),
                    merchant.upper(),
                    merchant,
                    sign * naira(amount),
                    category,
                )
            )
    return sorted(rows, key=lambda r: r.date)


def demo_statements() -> list[Statement]:
    march = [
        Row(date(2026, 3, d), desc, merchant, naira(amount), cat, desc in MARCH_ANOMALIES)
        for d, desc, merchant, amount, cat in MARCH
    ]
    return [
        Statement("opay_statement_january.pdf", date(2026, 1, 1), date(2026, 1, 31),
                  spread(2026, 1, JANUARY)),
        Statement("opay_statement_february.pdf", date(2026, 2, 1), date(2026, 2, 28),
                  spread(2026, 2, FEBRUARY)),
        Statement("opay_statement_march.pdf", date(2026, 3, 1), date(2026, 3, 31), march),
    ]
