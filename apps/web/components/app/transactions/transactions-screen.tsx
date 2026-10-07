"use client";

// All transactions with filters kept in the URL, so links from the overview and chat land
// already filtered and the back button undoes a filter.
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorCard } from "@/components/app/states";
import { TransactionRow } from "@/components/app/transaction-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { monthShort } from "@/lib/dates";
import type { Summary, TransactionPage } from "@/lib/models";
import { CATEGORIES } from "@/lib/spending";
import { useApi } from "@/lib/use-api";

const PAGE_SIZE = 50;

type Filters = { month: string; category: string; flagged: boolean; q: string; page: number };

function useFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = {
    month: params.get("month") ?? "",
    category: params.get("category") ?? "",
    flagged: params.get("flagged") === "1",
    q: params.get("q") ?? "",
    page: Number(params.get("page") ?? 1),
  };
  function update(patch: Partial<Filters>) {
    // any filter change goes back to the first page
    const next = { ...filters, page: 1, ...patch };
    const query = new URLSearchParams();
    if (next.month) query.set("month", next.month);
    if (next.category) query.set("category", next.category);
    if (next.flagged) query.set("flagged", "1");
    if (next.q) query.set("q", next.q);
    if (next.page > 1) query.set("page", String(next.page));
    router.replace(`${pathname}?${query}`, { scroll: false });
  }
  return [filters, update];
}

export function TransactionsScreen() {
  const [filters, update] = useFilters();
  const { data, error, reload } = useApi<TransactionPage>(`/transactions?${apiQuery(filters)}`);
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Transactions</h1>
      <FilterBar filters={filters} update={update} />
      {error ? <ErrorCard error={error} onRetry={reload} /> : <Results page={data} filters={filters} update={update} />}
    </div>
  );
}

function apiQuery(f: Filters): string {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((f.page - 1) * PAGE_SIZE) });
  if (f.month) query.set("month", f.month);
  if (f.category) query.set("category", f.category);
  if (f.flagged) query.set("flagged", "true");
  if (f.q) query.set("search", f.q);
  return query.toString();
}

function FilterBar({ filters, update }: { filters: Filters; update: (p: Partial<Filters>) => void }) {
  const { data: summary } = useApi<Summary>("/analytics/summary?months=12");
  const months = summary?.monthly.map((m) => m.month).reverse() ?? [];
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput value={filters.q} onChange={(q) => update({ q })} />
      <div className="flex flex-wrap gap-2">
        <Select label="Month" value={filters.month} onChange={(month) => update({ month })}>
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{`${monthShort(m)} ${m.slice(0, 4)}`}</option>
          ))}
        </Select>
        <Select label="Category" value={filters.category} onChange={(category) => update({ category })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <button
          type="button"
          aria-pressed={filters.flagged}
          onClick={() => update({ flagged: !filters.flagged })}
          className={clsx("h-11 rounded-full px-4 text-sm transition-colors", filters.flagged ? "bg-highlight text-[#292826]" : "bg-surface text-ink-2 hover:text-ink")}
        >
          Highlighted only
        </button>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  // the URL changed from elsewhere (clear filters, back button): show that instead of the draft
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  // wait for a pause in typing before filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft.trim() === value) return;
      setSynced(draft.trim());
      onChange(draft.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);
  return (
    <label className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface px-4 lg:flex-1 focus-within:outline-2 focus-within:outline-brand">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="sr-only">Search transactions</span>
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search a merchant or narration"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx("h-11 appearance-none rounded-full pr-9 pl-4 text-sm outline-none", value ? "bg-action text-on-action" : "bg-surface text-ink-2")}
      >
        {children}
      </select>
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-ink-3">▾</span>
    </label>
  );
}

function Results({ page, filters, update }: { page?: TransactionPage; filters: Filters; update: (p: Partial<Filters>) => void }) {
  if (!page) return <ResultsSkeleton />;
  if (page.total === 0) return <NoMatches onClear={() => update({ month: "", category: "", flagged: false, q: "" })} />;
  const first = page.offset + 1;
  const last = page.offset + page.transactions.length;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-2 sm:p-3">
        {page.transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-ink-3">
        <span>
          {first}–{last} of {page.total}
        </span>
        <div className="flex gap-2">
          <Button variant="quiet" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })} className="disabled:opacity-40">
            Previous
          </Button>
          <Button variant="quiet" disabled={last >= page.total} onClick={() => update({ page: filters.page + 1 })} className="disabled:opacity-40">
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[20px] bg-surface p-6">
      <span className="font-medium">Nothing matches those filters</span>
      <span className="text-sm text-ink-2">Try another month or search, or clear the filters to see everything.</span>
      <Button variant="quiet" onClick={onClear}>Clear filters</Button>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2 rounded-[20px] bg-surface p-4">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-10 rounded-xl" />
      ))}
    </div>
  );
}
