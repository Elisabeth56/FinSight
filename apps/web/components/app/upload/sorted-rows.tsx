"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { dayShort } from "@/lib/dates";
import type { Transaction, TransactionPage } from "@/lib/models";
import { money } from "@/lib/money";
import { shortCategory } from "@/lib/spending";
import { useApi } from "@/lib/use-api";

/** Placeholder rows while the server sorts: chips still pending. */
export function SortingRows() {
  return (
    <section aria-hidden className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-3">
      {[64, 48, 72, 56, 68, 44].map((w, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3.5 opacity-70">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3" style={{ width: `${w}%` }} />
          <Skeleton className="ml-auto h-6 w-[72px]" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </section>
  );
}

/** The statement's real rows, each chip landing in turn as if being sorted. */
export function SortedRows({ statementId }: { statementId: string }) {
  const { data } = useApi<TransactionPage>(`/transactions?statement_id=${statementId}&limit=200`);
  const rows = data?.transactions ?? [];
  const shown = useReveal(rows.length);
  if (!data) return <SortingRows />;
  return (
    <section className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-2 sm:p-3">
      {rows.map((tx, i) => (
        <Row key={tx.id} tx={tx} sorted={i < shown} />
      ))}
    </section>
  );
}

function useReveal(count: number): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce || count === 0) return;
    // the whole list lands in about 1.5 seconds, however long the statement is
    const step = Math.max(1, Math.ceil(count / 40));
    const timer = setInterval(() => setShown((n) => (n >= count ? n : n + step)), 40);
    return () => clearInterval(timer);
  }, [count, reduce]);
  return reduce ? count : shown;
}

function Row({ tx, sorted }: { tx: Transaction; sorted: boolean }) {
  return (
    <div className={clsx("flex items-center gap-3 rounded-xl px-3 py-3 transition-[opacity,background-color] duration-300", sorted ? "opacity-100" : "opacity-60", sorted && tx.is_anomaly && "bg-highlight-soft")}>
      <span className="hidden w-12 shrink-0 text-xs text-ink-3 sm:block">{dayShort(tx.transaction_date)}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{sorted ? tx.merchant || tx.description : tx.description}</span>
      <span className="relative h-6 w-[88px] shrink-0">
        <AnimatePresence initial={false}>
          {sorted ? (
            <motion.span
              key="chip"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={clsx("absolute right-0 inline-flex h-6 items-center rounded-full px-2.5 text-xs whitespace-nowrap", tx.is_anomaly ? "bg-highlight text-[#292826]" : "bg-sunk text-ink-2")}
            >
              {tx.is_anomaly ? "Unusual" : shortCategory(tx.category)}
            </motion.span>
          ) : (
            <span aria-label="Sorting" className="absolute right-0 h-6 w-[72px] rounded-full bg-sunk" />
          )}
        </AnimatePresence>
      </span>
      <span className={clsx("w-[88px] shrink-0 text-right text-sm tabular-nums", tx.amount_minor > 0 && "text-income")}>
        {money(tx.amount_minor, tx.currency, { signed: true })}
      </span>
    </div>
  );
}
