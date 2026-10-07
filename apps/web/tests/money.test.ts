import { describe, expect, it } from "vitest";

import { money, moneyShort } from "@/lib/money";

describe("money", () => {
  it("formats kobo as whole naira", () => {
    expect(money(28_450_000)).toBe("₦284,500");
  });

  it("keeps kobo when there are some", () => {
    expect(money(1_250_050)).toBe("₦12,500.50");
  });

  it("signs income and spending when asked", () => {
    expect(money(4_500_000, "NGN", { signed: true })).toBe("+₦45,000");
    expect(money(-410_000, "NGN", { signed: true })).toBe("−₦4,100");
  });

  it("uses the currency symbol it knows and the code otherwise", () => {
    expect(money(500, "USD")).toBe("$5");
    expect(money(500, "KES")).toBe("KES 5");
  });
});

describe("moneyShort", () => {
  it("rounds to thousands and millions for chart labels", () => {
    expect(moneyShort(28_450_000)).toBe("₦285k");
    expect(moneyShort(123_000_000)).toBe("₦1.2m");
    expect(moneyShort(200_000_000)).toBe("₦2m");
    expect(moneyShort(50_000, "USD")).toBe("$500");
  });
});
