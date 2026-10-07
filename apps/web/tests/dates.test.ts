import { describe, expect, it } from "vitest";

import { dayShort, greeting, monthShort, monthTitle } from "@/lib/dates";

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
