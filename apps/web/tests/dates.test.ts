import { describe, expect, it } from "vitest";

import { dayRange, dayShort, greeting, monthShort, monthTitle } from "@/lib/dates";

describe("dates", () => {
  it("formats API months and days", () => {
    expect(monthTitle("2026-03")).toBe("March 2026");
    expect(monthShort("2025-12")).toBe("Dec");
    expect(dayShort("2026-03-08")).toBe("8 Mar");
  });

  it("greets by local time of day", () => {
    expect(greeting(new Date(2026, 2, 1, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 2, 1, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 2, 1, 20))).toBe("Good evening");
  });
});

describe("dayRange", () => {
  it("shortens a range inside one month", () => {
    expect(dayRange("2026-03-01", "2026-03-31")).toBe("1 to 31 Mar 2026");
  });

  it("names both months, and both years only when they differ", () => {
    expect(dayRange("2026-01-04", "2026-03-28")).toBe("4 Jan to 28 Mar 2026");
    expect(dayRange("2025-12-20", "2026-01-10")).toBe("20 Dec 2025 to 10 Jan 2026");
  });
});
