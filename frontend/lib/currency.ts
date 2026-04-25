/**
 * Best-effort currency preference for the billing page.
 * Strategy: check navigator.language first (fast, no network),
 * fall back to USD. Nigerian locales → NGN, everything else → USD.
 */

import type { BillingCurrency } from "@/lib/types";

export function detectBillingCurrency(): BillingCurrency {
  if (typeof navigator === "undefined") return "USD";
  const lang = (navigator.language || "").toLowerCase();
  // en-NG, yo-NG, ha-NG, ig-NG, etc.
  if (lang.endsWith("-ng") || lang === "en-ng") return "NGN";
  // Timezone sanity check — catches NG users on en-US browsers
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Africa/Lagos") return "NGN";
  } catch {
    /* ignore */
  }
  return "USD";
}

export function formatPlanPrice(
  amount: number,
  currency: BillingCurrency,
): string {
  if (amount === 0) return "Free";
  try {
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
