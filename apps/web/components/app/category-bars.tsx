"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { money } from "@/lib/money";
import type { CategorySlice } from "@/lib/spending";

type Props = { slices: CategorySlice[]; currency: string; month: string };

/** Horizontal bars per category, longest first; each row opens that category's transactions. */
export function CategoryBars({ slices, currency, month }: Props) {
  const reduce = useReducedMotion();
  const max = Math.max(...slices.map((s) => s.totalMinor), 1);

  return (
    <ul className="flex flex-col gap-1">
      {slices.map((s, i) => (
        <li key={s.name}>
          <Link
            href={s.name === "Other" ? `/dashboard/transactions?month=${month}` : `/dashboard/transactions?month=${month}&category=${encodeURIComponent(s.name)}`}
            className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_5.5rem] items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sunk/60"
          >
            <span className="truncate text-sm text-ink-2">{s.name}</span>
            <span className="h-2.5 rounded-full bg-sunk">
              <motion.span
                className="block h-2.5 origin-left rounded-full"
                style={{ width: `${(s.totalMinor / max) * 100}%`, background: s.color }}
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span className="text-right text-sm tabular-nums">{money(s.totalMinor, currency)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
