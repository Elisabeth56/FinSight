"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  formatMoney,
  type Transaction,
  type TransactionListResponse,
} from "@/lib/types";
import { Panel, NoDataEmpty } from "@/components/Panel";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Health",
  "Travel",
  "Education",
  "Transfers",
  "Income",
  "Other",
];

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const params = useSearchParams();
  const anomalyOnly = params.get("anomaly") === "1";

  const [month, setMonth] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // reset to first page on filter change
  useEffect(() => {
    setOffset(0);
  }, [month, category, debouncedSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_SIZE));
      qs.set("offset", String(offset));
      if (month) qs.set("month", month);
      if (category) qs.set("category", category);
      if (debouncedSearch) qs.set("search", debouncedSearch);
      const result = await api<TransactionListResponse>(
        `/transactions?${qs.toString()}`,
      );
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [month, category, debouncedSearch, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo(() => {
    if (!data) return [];
    return anomalyOnly ? data.transactions.filter((t) => t.is_anomaly) : data.transactions;
  }, [data, anomalyOnly]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Transactions</h1>
          <p className="text-sm text-gray-400">
            {data ? `${data.total.toLocaleString()} total` : "Loading..."}
            {anomalyOnly && " · showing anomalies only"}
          </p>
        </div>
      </div>

      {/* ===== filter bar ===== */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/50"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/50 min-w-[160px]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {(month || category || debouncedSearch) && (
          <button
            onClick={() => {
              setMonth("");
              setCategory("");
              setSearch("");
            }}
            className="px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* ===== table ===== */}
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        data && data.total === 0 ? (
          <NoDataEmpty />
        ) : (
          <Panel>
            <p className="py-8 text-center text-sm text-gray-500">
              No transactions match these filters.
            </p>
          </Panel>
        )
      ) : (
        <div className="rounded-2xl bg-dark-800 border border-white/5 overflow-hidden">
          {/* desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                <th className="text-left font-medium py-3 px-5">Date</th>
                <th className="text-left font-medium py-3 px-5">Description</th>
                <th className="text-left font-medium py-3 px-5">Category</th>
                <th className="text-right font-medium py-3 px-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="py-3 px-5 text-sm text-gray-400 whitespace-nowrap">
                    {t.transaction_date}
                  </td>
                  <td className="py-3 px-5 text-sm text-white">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-md">{t.description}</span>
                      {t.is_anomaly && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          anomaly
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                      {t.category || "Uncategorized"}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-5 text-sm font-medium text-right whitespace-nowrap ${
                      Number(t.amount) >= 0 ? "text-green-400" : "text-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {Number(t.amount) >= 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* mobile card list */}
          <ul className="md:hidden divide-y divide-white/5">
            {rows.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {t.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.transaction_date} · {t.category || "Uncategorized"}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-medium whitespace-nowrap ${
                      Number(t.amount) >= 0 ? "text-green-400" : "text-white"
                    }`}
                  >
                    {formatMoney(t.amount, t.currency)}
                  </p>
                </div>
                {t.is_anomaly && (
                  <span className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    anomaly
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== pagination ===== */}
      {data && data.total > PAGE_SIZE && !anomalyOnly && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="p-2 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={offset + PAGE_SIZE >= data.total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="p-2 rounded-lg bg-dark-800 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-dark-800 border border-white/5 p-4 space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 bg-dark-700/50 rounded-lg" />
      ))}
    </div>
  );
}
