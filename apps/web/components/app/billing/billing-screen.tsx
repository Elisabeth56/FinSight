"use client";

// Plans and Pro status. Passes are one-time payments: Paystack sends people back here with
// ?reference=, and any checkout still pending is verified on load in case the return was lost.
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ErrorCard } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import type { Checkout, Me, PaymentStatus, Plan } from "@/lib/models";
import { guessCurrency, money } from "@/lib/money";
import { useApi } from "@/lib/use-api";

type Currency = "NGN" | "USD";
type Outcome = { kind: "paid"; until: string } | { kind: "failed" } | null;

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function BillingScreen() {
  const me = useApi<Me>("/me");
  const plans = useApi<Plan[]>("/plans");
  const outcome = useVerifyOnReturn(me.reload);
  const [error, setError] = useState<ApiError | null>(null);

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Billing</h1>
      {outcome && <OutcomeBanner outcome={outcome} />}
      {me.data ? <StatusCard me={me.data} /> : <Skeleton className="h-28 rounded-[20px]" />}
      {error && <ErrorCard error={error} onRetry={() => setError(null)} />}
      {plans.error && <ErrorCard error={plans.error} onRetry={plans.reload} />}
      {plans.data && <Plans plans={plans.data} isPro={me.data?.is_pro ?? false} onError={setError} />}
      <p className="text-[13px] text-ink-3">One-time payments through Paystack. Nothing renews on its own; a new pass adds its days after the current one.</p>
    </div>
  );
}

function useVerifyOnReturn(onPaid: () => void): Outcome {
  const params = useSearchParams();
  const router = useRouter();
  const returned = params.get("reference");
  const [outcome, setOutcome] = useState<Outcome>(null);

  useEffect(() => {
    let live = true;
    api<string[]>("/payments/pending")
      .then((pending) => Promise.all([...new Set([...(returned ? [returned] : []), ...pending])].map(verify)))
      .then((results) => {
        if (!live) return;
        const paid = results.find((r) => r?.status === "paid" && r.pro_until);
        if (paid) onPaid();
        if (paid) setOutcome({ kind: "paid", until: paid.pro_until! });
        else if (returned && results[0]?.status === "failed") setOutcome({ kind: "failed" });
        if (returned) router.replace("/dashboard/billing", { scroll: false });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [returned, router, onPaid]);

  return outcome;
}

const verify = (reference: string) => api<PaymentStatus>(`/payments/${reference}/verify`, { method: "POST" }).catch(() => null);

function OutcomeBanner({ outcome }: { outcome: NonNullable<Outcome> }) {
  if (outcome.kind === "failed") {
    return <div role="status" className="rounded-[20px] bg-sunk p-5 text-sm">That payment didn&apos;t go through, and you weren&apos;t charged. You can try again below.</div>;
  }
  return (
    <div role="status" className="rounded-[20px] bg-action p-5 text-sm text-on-action">
      Payment received. You&apos;re on Pro until <strong>{longDate(outcome.until)}</strong>.
    </div>
  );
}

function StatusCard({ me }: { me: Me }) {
  return (
    <section className="flex flex-col gap-1.5 rounded-[20px] bg-surface p-6">
      <span className="text-xs text-ink-3">Your plan</span>
      <span className="font-figure text-4xl leading-tight">{me.is_pro ? "Pro" : "Free"}</span>
      <span className="text-sm text-ink-2">
        {me.is_pro && me.pro_until
          ? `Unlimited uploads and savings reports until ${longDate(me.pro_until)}.`
          : `${Math.min(me.uploads_this_month, me.upload_limit ?? 0)} of ${me.upload_limit} free uploads used this month.`}
      </span>
    </section>
  );
}

const noop = () => () => {};

function Plans({ plans, isPro, onError }: { plans: Plan[]; isPro: boolean; onError: (e: ApiError) => void }) {
  const detected = useSyncExternalStore(noop, guessCurrency, () => "NGN" as const);
  const [picked, setPicked] = useState<Currency | null>(null);
  const currency = picked ?? detected;
  const [pending, setPending] = useState<string | null>(null);

  async function buy(planId: string) {
    setPending(planId);
    try {
      const { authorization_url } = await api<Checkout>("/payments", { method: "POST", body: { plan_id: planId, currency } });
      window.location.assign(authorization_url);
    } catch (e) {
      setPending(null);
      onError(e as ApiError);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{isPro ? "Add more time" : "Get Pro"}</h2>
        <CurrencySwitch currency={currency} onChange={setPicked} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} currency={currency} featured={plan.id === "pro_year"} busy={pending === plan.id} onBuy={() => buy(plan.id)} />
        ))}
      </div>
    </section>
  );
}

function CurrencySwitch({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <div role="group" aria-label="Currency" className="flex rounded-full bg-sunk p-1">
      {(["NGN", "USD"] as const).map((c) => (
        <button key={c} type="button" aria-pressed={currency === c} onClick={() => onChange(c)} className={clsx("h-9 rounded-full px-4 text-sm", currency === c && "bg-surface")}>
          {c}
        </button>
      ))}
    </div>
  );
}

type PlanCardProps = { plan: Plan; currency: Currency; featured: boolean; busy: boolean; onBuy: () => void };

function PlanCard({ plan, currency, featured, busy, onBuy }: PlanCardProps) {
  return (
    <div className={clsx("relative flex flex-col gap-4 rounded-[28px] p-7", featured ? "bg-[#1f5a43] text-[#faf9f7]" : "bg-surface")}>
      {featured && <span className="absolute top-6 right-6 inline-flex h-7 items-center rounded-full bg-[#ffcf4a] px-3 text-xs font-semibold text-[#292826]">Best value</span>}
      <span className="font-semibold">{plan.name}</span>
      <span className="font-figure text-[52px] leading-none">{money(plan.prices_minor[currency], currency)}</span>
      <span className={clsx("text-sm", featured ? "text-white/80" : "text-ink-2")}>
        {plan.days} days of unlimited uploads and savings reports. No auto-renewal.
      </span>
      <Button variant={featured ? "highlight" : "quiet"} onClick={onBuy} disabled={busy} className="mt-2">
        {busy ? "Opening Paystack" : `Pay ${money(plan.prices_minor[currency], currency)}`}
      </Button>
    </div>
  );
}
