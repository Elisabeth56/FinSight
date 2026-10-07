import { describe, expect, it } from "vitest";

import { shareLabel, shortCategory, topCategories } from "@/lib/spending";

const point = (category: string, total_minor: number) => ({ category, total_minor, count: 1 });

describe("topCategories", () => {
  it("keeps the biggest four and folds the rest into Other", () => {
    const slices = topCategories([
      point("Food & Dining", 900),
      point("Transport", 500),
      point("Shopping", 450),
      point("Other", 100),
      point("Bills & Utilities", 380),
      point("Health", 70),
    ]);
    expect(slices.map((s) => s.name)).toEqual(["Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Other"]);
    expect(slices.at(-1)?.totalMinor).toBe(170);
  });

  it("leaves Other out when nothing is left over", () => {
    expect(topCategories([point("Transport", 10)]).map((s) => s.name)).toEqual(["Transport"]);
  });
});

describe("shareLabel", () => {
  it("says common fractions in words", () => {
    expect(shareLabel(92_300, 284_500)).toBe("a third");
    expect(shareLabel(50, 100)).toBe("about half");
    expect(shareLabel(25, 100)).toBe("a quarter");
  });

  it("falls back to a percentage", () => {
    expect(shareLabel(17, 100)).toBe("17%");
    expect(shareLabel(5, 0)).toBe("0%");
  });
});

it("shortens paired category names", () => {
  expect(shortCategory("Bills & Utilities")).toBe("Bills");
  expect(shortCategory("Transport")).toBe("Transport");
});
