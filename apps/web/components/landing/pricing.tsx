"use client";

import clsx from "clsx";
import { useState, useSyncExternalStore } from "react";

import { LinkButton } from "@/components/ui/button";
import { guessCurrency } from "@/lib/money";
import { links } from "@/lib/site";

const noop = () => () => {};

const prices = {
  NGN: { free: "₦0", year: "₦30,000", month: "₦4,500" },
  USD: { free: "$0", year: "$35", month: "$5" },
};

/** Three cards with an NGN/USD switch that starts on the visitor's likely currency. */
export function Pricing() {
  // the server renders NGN; the browser swaps in its likely currency without a second render pass
  const detected = useSyncExternalStore(noop, guessCurrency, () => "NGN" as const);
  const [picked, setCurrency] = useState<"NGN" | "USD" | null>(null);
  const currency = picked ?? detected;
  const p = prices[currency];

  return (
    <section id="pricing" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-[560px] text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
          Free to start. Pay only when you want more.
        </h2>
        <div role="group" aria-label="Currency" className="flex rounded-full bg-sunk p-1">
          {(["NGN", "USD"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className={clsx("h-10 rounded-full px-4.5 text-sm", currency === c && "bg-surface")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <Plan name="Free" price={p.free} items={["One statement a month", "Categories, trends and highlighted charges", "Chat about your money"]}>
          <LinkButton href={links.signUp} variant="quiet" className="mt-auto">
            Start free
          </LinkButton>
        </Plan>
        <Plan
          name="Pro · 1 year"
          price={p.year}
          items={["Unlimited statements", "Monthly savings report", "Everything in Free"]}
          featured
        >
          <LinkButton href={links.signUp} variant="highlight" className="mt-auto">
            Get a year of Pro
          </LinkButton>
        </Plan>
        <Plan name="Pro · 1 month" price={p.month} items={["Everything in Pro for 30 days", "Good for a one-off clean-up", "No auto-renewal"]}>
          <LinkButton href={links.signUp} variant="quiet" className="mt-auto">
            Get a month
          </LinkButton>
        </Plan>
      </div>
      <p className="text-[13px] text-ink-3">One-time payments through Paystack. Nothing renews on its own.</p>
    </section>
  );
}

function Plan({
  name,
  price,
  items,
  featured,
  children,
}: {
  name: string;
  price: string;
  items: string[];
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "relative flex flex-col gap-5 rounded-[28px] p-8",
        featured ? "bg-[#1f5a43] text-[#faf9f7]" : "bg-surface",
      )}
    >
      {featured && (
        <span className="absolute top-7 right-7 inline-flex h-7 items-center rounded-full bg-[#ffcf4a] px-3 text-xs font-semibold text-[#292826]">
          Best value
        </span>
      )}
      <span className="font-semibold">{name}</span>
      <span className="font-figure text-[56px] leading-none">{price}</span>
      <ul className={clsx("flex flex-col gap-2.5 text-[15px]", featured ? "text-white/80" : "text-ink-2")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {children}
    </div>
  );
}
