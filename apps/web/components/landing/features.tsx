"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { categories, features, months } from "./content";

const FEATURE_MS = 5000;
const ease = [0.22, 1, 0.36, 1] as const;

/** Four features with a progress rail that advances every 5s; clicking jumps and restarts it. */
export function Features() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const next = setTimeout(() => setActive((a) => (a + 1) % features.length), FEATURE_MS);
    return () => clearTimeout(next);
  }, [active, cycle, reduce]);

  return (
    <section id="features" className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 pt-32 pb-28">
      <div className="flex max-w-[640px] flex-col gap-4">
        <span className="text-[13px] tracking-[0.02em] text-brand">What you get</span>
        <h2 className="text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
          One upload. Four ways to see your money.
        </h2>
      </div>

      <div className="flex flex-wrap items-stretch gap-8">
        <div role="tablist" aria-label="Features" className="flex flex-[1_1_340px] flex-col gap-1">
          {features.map((f, i) => {
            const on = i === active;
            return (
              <button
                key={f.title}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setActive(i);
                  setCycle((c) => c + 1);
                }}
                className={clsx(
                  "relative flex flex-col gap-1.5 overflow-hidden rounded-[20px] py-5.5 pr-6 pl-7 text-left transition-colors",
                  on ? "bg-surface" : "hover:bg-surface/60",
                )}
              >
                <span aria-hidden className="absolute top-5.5 bottom-5.5 left-2.5 w-1 rounded-full bg-sunk" />
                {on && (
                  <motion.span
                    key={`${active}-${cycle}`}
                    aria-hidden
                    className="absolute top-5.5 bottom-5.5 left-2.5 w-1 origin-top rounded-full bg-brand"
                    initial={{ scaleY: reduce ? 1 : 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: reduce ? 0 : FEATURE_MS / 1000, ease: "linear" }}
                  />
                )}
                <span className={clsx("text-xl font-semibold tracking-[-0.01em]", on ? "text-ink" : "text-ink-3")}>
                  {f.title}
                </span>
                <span className={clsx("text-[15px] leading-relaxed text-ink-2", !on && "opacity-70")}>{f.body}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          className="relative flex min-h-[440px] min-w-0 flex-[1.25_1_460px] items-center justify-center overflow-hidden rounded-[28px] bg-[#1f5a43] p-7"
        >
          <span aria-hidden className="absolute -bottom-20 -left-20 size-70 rounded-full border border-white/10" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="w-full max-w-[440px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
            >
              {active === 0 && <CategoryPanel />}
              {active === 1 && <FlaggedPanel />}
              {active === 2 && <MonthsPanel />}
              {active === 3 && <SavingsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-[22px] bg-[#faf9f7] p-5.5 text-[#292826]", className)}>{children}</div>;
}

function CategoryPanel() {
  return (
    <Card className="flex flex-col gap-3.5">
      <span className="text-sm font-semibold">March by category</span>
      {categories.map((c, i) => (
        <div key={c.name} className="grid grid-cols-[110px_minmax(0,1fr)_80px] items-center gap-3">
          <span className="text-[13px] text-[#54524f]">{c.name}</span>
          <div className="h-2.5 rounded-full bg-[#e8e6e2]">
            <motion.div
              className="h-2.5 rounded-full"
              style={{ background: c.color === "var(--ink-4)" ? "#a9a8a7" : c.color }}
              initial={{ width: 0 }}
              animate={{ width: `${c.pct}%` }}
              transition={{ duration: 0.8, delay: i * 0.07, ease }}
            />
          </div>
          <span className="text-right text-[13px] tabular-nums">{c.amt}</span>
        </div>
      ))}
    </Card>
  );
}

function FlaggedPanel() {
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex gap-3 py-3.5 opacity-55">
        <span className="flex-1 text-sm">JUMIA ONLINE PAYMENT · Feb</span>
        <span className="text-sm tabular-nums">−₦14,800</span>
      </Card>
      <div className="flex flex-col gap-2.5 rounded-[20px] bg-[#ffcf4a] p-4.5 text-[#292826] shadow-[0_16px_40px_rgb(0_0_0/0.18)]">
        <div className="flex gap-3 text-[15px] font-semibold">
          <span className="flex-1">JUMIA ONLINE PAYMENT · Mar</span>
          <span className="tabular-nums">−₦45,000</span>
        </div>
        <span className="text-sm leading-relaxed text-[#3d3a33]">
          3× your usual Shopping charge. Your typical one is about ₦15,000.
        </span>
      </div>
      <Card className="flex gap-3 py-3.5 opacity-55">
        <span className="flex-1 text-sm">JUMIA ONLINE PAYMENT · Jan</span>
        <span className="text-sm tabular-nums">−₦16,200</span>
      </Card>
    </div>
  );
}

function MonthsPanel() {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">Spending by month</span>
        <span className="text-xs text-[#6b6966]">Oct–Mar</span>
      </div>
      <div className="flex h-50 items-end gap-3.5">
        {months.map(([label, h], i) => (
          <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <motion.div
              className={clsx("w-full rounded-lg", i === months.length - 1 ? "bg-[#ffcf4a]" : "bg-[#c5dccd]")}
              initial={{ height: "3%" }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.8, delay: i * 0.06, ease }}
            />
            <span className="text-xs text-[#6b6966]">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SavingsPanel() {
  const cuts = [
    ["Cook 4 of the 11 Chowdeck nights", "₦24,000"],
    ["Drop the iCloud plan you don't use", "₦1,900"],
    ["Take a danfo for the Yaba commute twice a week", "₦12,100"],
  ];
  return (
    <Card className="flex flex-col gap-4 p-6">
      <span className="text-xs text-[#6b6966]">Savings report · March</span>
      <span className="font-figure text-[44px] leading-none">
        Save about <mark className="rounded-lg bg-[#ffcf4a] px-2 text-[#292826]">₦38,000</mark> a month
      </span>
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed">
        {cuts.map(([what, amount]) => (
          <div key={what} className="flex gap-3">
            <span className="flex-1 text-[#54524f]">{what}</span>
            <span className="tabular-nums">{amount}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-[#6b6966]">Amounts are worked out from your rows, not guessed.</span>
    </Card>
  );
}
