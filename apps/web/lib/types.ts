/**
 * Types shared between frontend and FastAPI.
 * Keep in sync with backend/schemas/*.py
 */

export type Plan = "free" | "pro";
export type BillingCurrency = "NGN" | "USD";
export type PaymentType = "one_time" | "subscription";
export type PlanId = "free" | "pro_monthly" | "pro_yearly" | "pro_lifetime";

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string | null;
}

/* ---------- transactions ---------- */
export interface Transaction {
  id: string;
  transaction_date: string; // YYYY-MM-DD
  description: string;
  amount: number | string;
  currency: string;
  category: string | null;
  is_anomaly: boolean;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

/* ---------- upload ---------- */
export interface UploadResult {
  statement_id: string;
  filename: string;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  transaction_count: number;
  anomaly_count: number;
}

/* ---------- analytics ---------- */
export interface MonthlyPoint {
  month: string;
  total_spent: number;
  total_income: number;
}

export interface CategoryPoint {
  category: string;
  total: number;
  count: number;
}

export interface AnalyticsSummary {
  currency: string;
  monthly: MonthlyPoint[];
  by_category: CategoryPoint[];
  anomaly_count: number;
  total_transactions: number;
}

/* ---------- savings report ---------- */
export interface SavingsOpportunity {
  title: string;
  description: string;
  category: string;
  estimated_monthly_savings: number;
}

export interface SavingsReport {
  empty?: boolean;
  message?: string;
  error?: string;
  summary?: string;
  total_monthly_savings?: number;
  opportunities?: SavingsOpportunity[];
  currency?: string;
  window_days?: number;
}

/* ---------- currency helper ---------- */
const CURRENCY_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};

export function formatMoney(
  amount: number | string,
  currency = "USD",
): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

/* ---------- billing ---------- */

export interface PlanCatalogEntry {
  id: PlanId;
  name: string;
  price: { NGN: number; USD: number };
  interval: "monthly" | "yearly" | "one_time" | null;
}

export interface PlansResponse {
  plans: PlanCatalogEntry[];
  free_upload_quota: number;
}

export interface InitializeResponse {
  authorization_url: string;
  reference: string;
}

export interface SubscriptionStatus {
  plan: Plan;
  status: "active" | "inactive" | "cancelled" | "past_due";
  payment_type: PaymentType | null;
  current_period_end: string | null;
  amount: number | null;
  currency: BillingCurrency | null;
}

/* ---------- paywall error from 402 responses ---------- */
export interface PaywallError {
  error: "pro_required" | "upload_quota_exceeded";
  message: string;
  quota?: number;
  used?: number;
}
