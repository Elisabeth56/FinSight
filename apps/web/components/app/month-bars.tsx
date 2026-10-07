"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";

import { monthName, monthShort } from "@/lib/dates";
import type { MonthPoint } from "@/lib/models";
import { money, moneyShort } from "@/lib/money";

type Props = { months: MonthPoint[]; selected: string; currency: string; onSelect: (month: string) => void };

/** Spending per month as rounded bars that grow in; the selected month is green. Tap a bar to pick it. */
export function MonthBars({ months, selected, currency, onSelect }: Props) {
  const reduce = useReducedMotion();
  const max = Math.max(...months.map((m) => m.spent_minor), 1);

  return (
    <div className="flex h-[200px] items-end gap-3 sm:gap-4">
      {months.map((m, i) => {
        const active = m.month === selected;
        return (
          <button
            key={m.month}
            type="button"
            aria-pressed={active}
            aria-label={`${monthName(m.month)}: ${money(-m.spent_minor, currency)} spent`}
            onClick={() => onSelect(m.month)}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="flex min-h-0 w-full flex-1 flex-col items-center justify-end gap-2">
              <span className={clsx("text-xs tabular-nums transition-opacity", active ? "text-ink" : "text-ink-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                {moneyShort(m.spent_minor, currency)}
              </span>
              <motion.span
                className={clsx("w-full max-w-12 origin-bottom rounded-lg transition-colors", active ? "bg-brand" : "bg-ink-4/45 group-hover:bg-ink-4/70")}
                // leave room for the value label above the tallest bar
                style={{ height: `${Math.max((m.spent_minor / max) * 82, 3)}%` }}
                initial={{ scaleY: reduce ? 1 : 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span className={clsx("text-xs", active ? "font-medium text-ink" : "text-ink-3")}>{monthShort(m.month)}</span>
          </button>
        );
      })}
    </div>
  );
}
