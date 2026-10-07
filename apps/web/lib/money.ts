const SYMBOLS: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

/** Minor units (kobo, cents) to a display string: 28450000 → "₦284,500". */
export function money(minor: number, currency = "NGN", { signed = false } = {}): string {
  const value = Math.abs(minor) / 100;
  const digits = Number.isInteger(value) ? 0 : 2;
  const body = value.toLocaleString("en-NG", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = signed ? (minor < 0 ? "−" : "+") : minor < 0 ? "−" : "";
  return `${sign}${SYMBOLS[currency] ?? `${currency} `}${body}`;
}

/** NGN for people in Nigeria (by time zone or locale), USD otherwise. No geo-IP call needed. */
export function guessCurrency(): "NGN" | "USD" {
  if (typeof window === "undefined") return "NGN";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lang = navigator.language || "";
  return zone === "Africa/Lagos" || lang.endsWith("-NG") ? "NGN" : "USD";
}
