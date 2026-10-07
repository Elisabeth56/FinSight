"use client";

// The overview: one month's figures with the months before it. The latest month loads first;
// picking another month (remembered per browser) loads that month's figures beside it.
import clsx from "clsx";
import Link from "next/link";

import { CategoryBars } from "@/components/app/category-bars";
import { MonthBars } from "@/components/app/month-bars";
import { EmptyOverview, ErrorCard, OverviewSkeleton } from "@/components/app/states";
import { StatTile } from "@/components/app/stat-tile";
import { TransactionRow } from "@/components/app/transaction-row";
import { LinkButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { greeting, monthName, monthShort, monthTitle } from "@/lib/dates";
import type { Me, Summary, TransactionPage } from "@/lib/models";
import { money } from "@/lib/money";
import { shareLabel, shortCategory, topCategories } from "@/lib/spending";
import { useApi } from "@/lib/use-api";
import { useCountUp } from "@/lib/use-count-up";
import { useStoredState } from "@/lib/use-stored-state";

/** Loads the latest summary, then hands over to the month view (or the empty state). */
export function Overview() {
  const latest = useApi<Summary>("/analytics/summary?months=6");
  const [stored, setStored] = useStoredState("finsight:overview-month");

  if (latest.error) return <ErrorCard error={latest.error} onRetry={latest.reload} />;
  if (!latest.data) return <OverviewSkeleton />;
  if (latest.data.transaction_count === 0 || !latest.data.month) return <EmptyOverview />;
  return <MonthView base={latest.data} stored={stored} onSelect={setStored} />;
}

type MonthViewProps = { base: Summary; stored: string | null; onSelect: (month: string) => void };

function MonthView({ base, stored, onSelect }: MonthViewProps) {
  const months = base.monthly.map((m) => m.month);
  const month = stored && months.includes(stored) ? stored : (base.month as string);
  const isLatest = month === base.month;
  const picked = useApi<Summary>(isLatest ? null : `/analytics/summary?month=${month}&currency=${base.currency}`);
  const summary = isLatest ? base : picked.data;
  const currency = base.currency ?? "NGN";

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:gap-8">
      <Header month={month} months={months} onSelect={onSelect} />
      {picked.error ? (
        <ErrorCard error={picked.error} onRetry={picked.reload} />
      ) : (
        <Tiles summary={summary} month={month} previous={months[months.indexOf(month) - 1]} />
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Spending by month" aside={`${monthShort(months[0])} to ${monthShort(months.at(-1)!)}`}>
          <MonthBars months={base.monthly} selected={month} currency={currency} onSelect={onSelect} />
        </Panel>
        <Panel title="Where it went" aside={monthName(month)}>
          {summary ? <CategoryBars slices={topCategories(summary.by_category)} currency={currency} month={month} /> : <BarsSkeleton />}
        </Panel>
      </div>
      <Recent month={month} />
    </div>
  );
}

function Header({ month, months, onSelect }: { month: string; months: string[]; onSelect: (m: string) => void }) {
  const { data: me } = useApi<Me>("/me");
  const firstName = me?.full_name?.split(" ")[0];
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="h-[18px] text-xs tracking-[0.01em] text-ink-3">
          {greeting()}
          {firstName && `, ${firstName}`}
        </span>
        <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">{monthTitle(month)}</h1>
      </div>
      <div className="flex max-w-full items-center gap-3">
        <MonthPicker month={month} months={months} onSelect={onSelect} />
        <span className="hidden lg:block">
          <LinkButton href="/dashboard/upload" variant="action">
            Upload statement
          </LinkButton>
        </span>
      </div>
    </header>
  );
}

function MonthPicker({ month, months, onSelect }: { month: string; months: string[]; onSelect: (m: string) => void }) {
  return (
    <div role="group" aria-label="Month" className="flex max-w-full overflow-x-auto rounded-full bg-sunk p-1">
      {months.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={m === month}
          onClick={() => onSelect(m)}
          className={clsx(
            "h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-200 ease-ui",
            m === month ? "bg-surface text-ink" : "text-ink-2 hover:text-ink",
          )}
        >
          {monthShort(m)}
        </button>
      ))}
    </div>
  );
}

function Tiles({ summary, month, previous }: { summary?: Summary; month: string; previous?: string }) {
  if (!summary) return <TilesSkeleton />;
  const currency = summary.currency ?? "NGN";
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <SpentTile summary={summary} previous={previous} />
      <StatTile
        label="Money in"
        tone="income"
        value={money(summary.income_minor, currency)}
        note={incomeNote(summary)}
      />
      <TopCategoryTile summary={summary} />
      <FlaggedTile count={summary.anomaly_count} month={month} />
    </div>
  );
}

function SpentTile({ summary, previous }: { summary: Summary; previous?: string }) {
  const currency = summary.currency ?? "NGN";
  const shown = useCountUp(summary.spent_minor);
  const prev = summary.previous_spent_minor;
  const diff = prev === null ? 0 : prev - summary.spent_minor;
  const note =
    prev === null || !previous ? (
      "The first month on record"
    ) : (
      <>
        <mark className="rounded bg-highlight-soft px-1 text-ink">
          {money(Math.abs(diff), currency)} {diff >= 0 ? "less" : "more"}
        </mark>{" "}
        than {monthName(previous)}
      </>
    );
  return (
    <StatTile
      label="Spent"
      value={money(Math.round(shown / 10_000) * 10_000, currency)}
      note={note}
      big
      className="col-span-2 sm:col-span-1"
    />
  );
}

function incomeNote(summary: Summary): string {
  const currency = summary.currency ?? "NGN";
  const left = summary.income_minor - summary.spent_minor;
  if (summary.income_minor === 0) return "Nothing came in this month";
  if (left >= 0) return `You kept ${money(left, currency)} of it`;
  return `${money(-left, currency)} more went out than came in`;
}

function TopCategoryTile({ summary }: { summary: Summary }) {
  const top = summary.by_category[0];
  if (!top) return <StatTile label="Top category" value="None" note="No spending this month" className="hidden sm:flex" />;
  return (
    <StatTile
      label="Top category"
      value={shortCategory(top.category)}
      note={`${money(top.total_minor, summary.currency ?? "NGN")}, ${shareLabel(top.total_minor, summary.spent_minor)} of spending`}
      className="hidden sm:flex"
    />
  );
}

function FlaggedTile({ count, month }: { count: number; month: string }) {
  const { data } = useApi<TransactionPage>(count > 0 ? `/transactions?month=${month}&flagged=true&limit=5` : null);
  if (count === 0) return <StatTile label="Highlighted for you" value="All clear" note="No charge stood out this month" />;
  const biggest = data?.transactions.toSorted((a, b) => a.amount_minor - b.amount_minor)[0];
  const note = biggest
    ? `${money(-biggest.amount_minor, biggest.currency)} at ${biggest.merchant ?? biggest.description}${count > 1 ? ` and ${count - 1} more` : ""}`
    : "Charges far above your usual";
  return (
    <StatTile
      label="Highlighted for you"
      tone="highlight"
      value={`${count} ${count === 1 ? "charge" : "charges"}`}
      note={note}
      href={`/dashboard/transactions?month=${month}&flagged=1`}
    />
  );
}

function Recent({ month }: { month: string }) {
  const { data, error, reload } = useApi<TransactionPage>(`/transactions?month=${month}&limit=5`);
  return (
    <section className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-2 sm:p-3">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="font-semibold">Recent</h2>
        <Link href={`/dashboard/transactions?month=${month}`} className="text-sm text-brand underline-offset-4 hover:underline">
          All transactions
        </Link>
      </div>
      {error && <ErrorCard error={error} onRetry={reload} />}
      {!data && !error && [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="mx-3 my-2 h-9 rounded-xl" />)}
      {data?.transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
    </section>
  );
}

function Panel({ title, aside, children }: { title: string; aside: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[20px] bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-ink-3">{aside}</span>
      </div>
      {children}
    </section>
  );
}

function TilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[148px] rounded-[20px] first:col-span-2 sm:first:col-span-1" />
      ))}
    </div>
  );
}

function BarsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-2.5" />
      ))}
    </div>
  );
}
