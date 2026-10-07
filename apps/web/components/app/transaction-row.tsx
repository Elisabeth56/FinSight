import clsx from "clsx";

import { dayShort } from "@/lib/dates";
import type { Transaction } from "@/lib/models";
import { money } from "@/lib/money";
import { shortCategory } from "@/lib/spending";

/** One transaction: date, readable merchant (raw narration underneath), category chip, amount. */
export function TransactionRow({ tx }: { tx: Transaction }) {
  const name = tx.merchant || tx.description;
  return (
    <div className={clsx("flex items-center gap-3 rounded-xl px-3 py-3", tx.is_anomaly && "bg-highlight-soft")}>
      <span className="hidden w-12 shrink-0 text-xs text-ink-3 sm:block">{dayShort(tx.transaction_date)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm">{name}</span>
        <span className="truncate text-xs text-ink-3">
          <span className="sm:hidden">{dayShort(tx.transaction_date)} · </span>
          {tx.merchant ? tx.description : shortCategory(tx.category)}
        </span>
      </span>
      <span
        className={clsx(
          "hidden shrink-0 rounded-full px-2.5 py-1 text-xs sm:inline",
          tx.is_anomaly ? "bg-highlight text-[#292826]" : "bg-sunk text-ink-2",
        )}
      >
        {tx.is_anomaly ? "Unusual" : shortCategory(tx.category)}
      </span>
      <span className={clsx("w-24 shrink-0 text-right text-sm tabular-nums", tx.amount_minor > 0 && "text-income")}>
        {money(tx.amount_minor, tx.currency, { signed: true })}
      </span>
    </div>
  );
}
