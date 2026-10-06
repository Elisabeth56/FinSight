"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import {
  detectBillingCurrency,
  formatPlanPrice,
} from "@/lib/currency";
import type {
  BillingCurrency,
  InitializeResponse,
  PaymentType,
  PlanId,
  PlansResponse,
  SubscriptionStatus,
} from "@/lib/types";
import { Panel } from "@/components/Panel";

type Cycle = "monthly" | "yearly";

export default function BillingPage() {
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [currency, setCurrency] = useState<BillingCurrency>("USD");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [paymentType, setPaymentType] = useState<PaymentType>("subscription");
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(detectBillingCurrency());
    Promise.all([
      api<PlansResponse>("/payments/plans"),
      api<SubscriptionStatus>("/payments/subscription").catch(() => null),
    ]).then(([p, s]) => {
      setPlans(p);
      setSubscription(s);
    });
  }, []);

  async function handleUpgrade(planId: PlanId) {
    setError(null);
    setUpgrading(planId);
    try {
      const resp = await api<InitializeResponse>("/payments/initialize", {
        method: "POST",
        body: { plan_id: planId, currency, payment_type: paymentType },
      });
      // Hard redirect to Paystack — it's a different origin
      window.location.href = resp.authorization_url;
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not start payment.";
      setError(msg);
      setUpgrading(null);
    }
  }

  const isPro = subscription?.plan === "pro";

  // Which plan gets shown based on cycle + payment type toggle
  const featuredPlanId: PlanId =
    paymentType === "one_time"
      ? "pro_lifetime"
      : cycle === "yearly"
        ? "pro_yearly"
        : "pro_monthly";

  const featuredPlan = plans?.plans.find((p) => p.id === featuredPlanId);
  const freePlan = plans?.plans.find((p) => p.id === "free");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing & Plans</h1>
        <p className="text-sm text-gray-400">
          {isPro
            ? "You're on the Pro plan. Thank you!"
            : "Upgrade to unlock unlimited uploads and savings reports."}
        </p>
      </div>

      {isPro && subscription && <CurrentPlanBanner subscription={subscription} />}

      {/* ===== toggles ===== */}
      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <Toggle
            active={paymentType === "subscription"}
            onClick={() => setPaymentType("subscription")}
          >
            Subscription
          </Toggle>
          <Toggle
            active={paymentType === "one_time"}
            onClick={() => setPaymentType("one_time")}
          >
            One-time
          </Toggle>
        </div>

        {paymentType === "subscription" && (
          <div className="flex gap-2">
            <Toggle active={cycle === "monthly"} onClick={() => setCycle("monthly")}>
              Monthly
            </Toggle>
            <Toggle active={cycle === "yearly"} onClick={() => setCycle("yearly")}>
              Yearly
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                -17%
              </span>
            </Toggle>
          </div>
        )}

        <div className="flex gap-2">
          <Toggle active={currency === "NGN"} onClick={() => setCurrency("NGN")}>
            NGN ₦
          </Toggle>
          <Toggle active={currency === "USD"} onClick={() => setCurrency("USD")}>
            USD $
          </Toggle>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ===== pricing cards ===== */}
      {!plans ? (
        <PlansSkeleton />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Free */}
          {freePlan && (
            <PlanCard
              name="Free"
              price={formatPlanPrice(0, currency)}
              priceLabel="forever"
              features={[
                "1 statement upload per month",
                "Automatic categorization",
                "Chat with your transactions",
                "Monthly trend charts",
              ]}
              cta={isPro ? "Included" : "Current plan"}
              disabled={true}
              current={!isPro}
            />
          )}

          {/* Pro (featured) */}
          {featuredPlan && (
            <PlanCard
              name={featuredPlan.name}
              price={formatPlanPrice(featuredPlan.price[currency], currency)}
              priceLabel={
                featuredPlan.interval === "yearly"
                  ? "per year"
                  : featuredPlan.interval === "monthly"
                    ? "per month"
                    : "one-time · 1 year access"
              }
              features={[
                "Unlimited statement uploads",
                "AI-powered savings report",
                "Everything in Free",
                paymentType === "subscription"
                  ? "Cancel anytime"
                  : "No recurring charges",
              ]}
              cta={
                isPro
                  ? "Current plan"
                  : upgrading === featuredPlan.id
                    ? "Redirecting..."
                    : "Upgrade now"
              }
              disabled={isPro || upgrading !== null}
              loading={upgrading === featuredPlan.id}
              onClick={() => handleUpgrade(featuredPlan.id)}
              featured
              current={isPro}
            />
          )}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">
        Payments processed securely by Paystack. Cards, bank transfer, and USSD supported.
      </p>
    </>
  );
}

/* ---------------- components ---------------- */

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-colors ${
        active
          ? "bg-white/10 text-white border border-white/15"
          : "text-gray-400 hover:text-white border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function PlanCard({
  name,
  price,
  priceLabel,
  features,
  cta,
  disabled,
  loading,
  onClick,
  featured,
  current,
}: {
  name: string;
  price: string;
  priceLabel: string;
  features: string[];
  cta: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  featured?: boolean;
  current?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-6 border ${
        featured
          ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30"
          : "bg-dark-800 border-white/5"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Recommended
        </div>
      )}
      {current && (
        <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/10">
          Current
        </div>
      )}

      <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
      <div className="mb-5">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-sm text-gray-400 ml-2">{priceLabel}</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-green-400" />
            </div>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
          featured && !disabled
            ? "bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 hover:from-green-400 hover:to-emerald-300"
            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {cta}
      </button>
    </motion.div>
  );
}

function CurrentPlanBanner({ subscription }: { subscription: SubscriptionStatus }) {
  const renews = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <Panel className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">You're on Pro</p>
          <p className="text-xs text-gray-500">
            Status: {subscription.status}
            {renews && ` · Renews ${renews}`}
            {subscription.payment_type && ` · ${subscription.payment_type.replace("_", "-")}`}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4 animate-pulse">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-80 bg-dark-800 rounded-2xl" />
      ))}
    </div>
  );
}
