"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  formatMoney,
  type AnalyticsSummary,
  type Transaction,
  type TransactionListResponse,
} from "@/lib/types";

import { StatCard } from "@/components/StatCard";
import { NoDataEmpty, Panel } from "@/components/Panel";
import {
  CategoryPieChart,
  MonthlyTrendChart,
} from "@/components/Charts";

export default function DashboardOverview() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r] = await Promise.all([
          api<AnalyticsSummary>("/analytics/summary?months=6"),
          api<TransactionListResponse>("/transactions?limit=5"),
        ]);
        if (!cancelled) {
          setSummary(s);
          setRecent(r.transactions);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  const isEmpty = !summary || summary.total_transactions === 0;

  if (isEmpty) {
    return (
      <>
        <PageHeader />
        <NoDataEmpty />
      </>
    );
  }

  // ----- derived stats (current month = last in series) -----
  const months = summary!.monthly;
  const current = months[months.length - 1];
  const previous = months.length > 1 ? months[months.length - 2] : null;
  const spendChange =
    previous && previous.total_spent > 0
      ? ((current.total_spent - previous.total_spent) / previous.total_spent) * 100
      : 0;
  const topCategory = summary!.by_category[0];
  const currency = summary!.currency;

  return (
    <>
      <PageHeader />

      {/* ===== stat grid ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Wallet}
          label="This month spend"
          value={formatMoney(current.total_spent, currency)}
          hint={
            previous
              ? `${spendChange >= 0 ? "+" : ""}${spendChange.toFixed(1)}% vs last`
              : undefined
          }
          accent={spendChange > 0 ? "orange" : "green"}
        />
        <StatCard
          icon={ArrowDownRight}
          label="This month income"
          value={formatMoney(current.total_income, currency)}
          accent="green"
          delay={0.05}
        />
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={summary!.total_transactions.toLocaleString()}
          accent="blue"
          delay={0.1}
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalies"
          value={summary!.anomaly_count.toString()}
          hint={topCategory ? `Top: ${topCategory.category}` : undefined}
          accent={summary!.anomaly_count > 0 ? "orange" : "purple"}
          delay={0.15}
        />
      </div>

      {/* ===== anomaly banner ===== */}
      {summary!.anomaly_count > 0 && <AnomalyBanner count={summary!.anomaly_count} />}

      {/* ===== charts ===== */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel
          title="Monthly trend"
          subtitle="Spending vs income over time"
          className="lg:col-span-2"
        >
          <MonthlyTrendChart data={months} currency={currency} />
        </Panel>
        <Panel title="By category" subtitle="This window">
          <CategoryPieChart
            data={summary!.by_category.slice(0, 6)}
            currency={currency}
          />
        </Panel>
      </div>

      {/* ===== recent transactions ===== */}
      <Panel
        title="Recent activity"
        right={
          <Link
            href="/dashboard/transactions"
            className="text-xs text-green-400 hover:text-green-300"
          >
            View all →
          </Link>
        }
      >
        <ul className="divide-y divide-white/5">
          {recent.map((t) => (
            <li key={t.id} className="py-3 flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  Number(t.amount) >= 0
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {Number(t.amount) >= 0 ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{t.description}</p>
                <p className="text-xs text-gray-500">
                  {t.transaction_date} · {t.category || "Uncategorized"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    Number(t.amount) >= 0 ? "text-green-400" : "text-white"
                  }`}
                >
                  {formatMoney(t.amount, t.currency)}
                </p>
                {t.is_anomaly && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 mt-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    anomaly
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

/* ---------- helpers ---------- */

function PageHeader() {
  return (
    <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
        <p className="text-sm text-gray-400">
          Your spending at a glance — updated with every upload.
        </p>
      </div>
      <Link
        href="/dashboard/savings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-green-400" />
        Generate savings report
      </Link>
    </div>
  );
}

function AnomalyBanner({ count }: { count: number }) {
  return (
    <div className="mb-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/5 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
        <TrendingDown className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white font-medium">
          {count} unusual {count === 1 ? "transaction" : "transactions"} detected
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Review flagged items to catch fraud or unexpected subscriptions.
        </p>
      </div>
      <Link
        href="/dashboard/transactions?anomaly=1"
        className="text-xs text-orange-400 hover:text-orange-300 font-medium self-center"
      >
        Review →
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-dark-800 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-dark-800 rounded-2xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 bg-dark-800 rounded-2xl" />
        <div className="h-72 bg-dark-800 rounded-2xl" />
      </div>
    </div>
  );
}
