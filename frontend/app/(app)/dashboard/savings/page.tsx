"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  DollarSign,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { formatMoney, type SavingsReport } from "@/lib/types";
import { NoDataEmpty, Panel } from "@/components/Panel";
import { PaywallModal } from "@/components/PaywallModal";

export default function SavingsPage() {
  const [report, setReport] = useState<SavingsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const r = await api<SavingsReport>("/report/savings", { method: "POST" });
      setReport(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setPaywall(true);
      } else {
        setError(e instanceof ApiError ? e.message : "Generation failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-400" />
          Savings opportunities
        </h1>
        <p className="text-sm text-gray-400">
          On-demand AI report — finds concrete ways to reduce spend based on your actual transactions.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!report && !loading && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Panel className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                <Lightbulb className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready when you are
              </h3>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                We&apos;ll analyze your last 90 days of spending and suggest
                3–5 concrete savings opportunities with estimated amounts.
              </p>
              {error && (
                <p className="mb-4 text-sm text-red-300">{error}</p>
              )}
              <button
                onClick={generate}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium hover:from-green-400 hover:to-emerald-300 transition-colors"
              >
                Generate report
                <ArrowRight className="w-4 h-4" />
              </button>
            </Panel>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Panel className="text-center py-14">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-green-400 animate-spin" />
              <p className="text-white font-medium mb-1">Analyzing your spending...</p>
              <p className="text-sm text-gray-500">
                Aggregating categories · querying LLaMA 3 · summarizing opportunities
              </p>
            </Panel>
          </motion.div>
        )}

        {report && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {report.empty ? (
              <NoDataEmpty
                title="Not enough data yet"
                hint={report.message || "Upload a statement to unlock your savings report."}
              />
            ) : report.error ? (
              <Panel>
                <p className="py-8 text-center text-sm text-red-300">
                  {report.error}
                </p>
              </Panel>
            ) : (
              <ReportView report={report} onRegenerate={generate} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PaywallModal
        open={paywall}
        onClose={() => setPaywall(false)}
        title="Savings report is a Pro feature"
        message="Upgrade to unlock AI-generated savings opportunities based on your last 90 days of spending."
      />
    </>
  );
}

/* ---------- report view ---------- */

function ReportView({
  report,
  onRegenerate,
}: {
  report: SavingsReport;
  onRegenerate: () => void;
}) {
  const currency = report.currency || "USD";
  return (
    <div className="space-y-5">
      {/* hero summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-6"
      >
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">
              Potential monthly savings
            </p>
            <p className="text-4xl font-bold text-white mb-3">
              {formatMoney(report.total_monthly_savings ?? 0, currency)}
            </p>
            {report.summary && (
              <p className="text-sm text-gray-300 max-w-xl">
                {report.summary}
              </p>
            )}
          </div>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Regenerate
          </button>
        </div>
      </motion.div>

      {/* opportunities */}
      <div className="grid md:grid-cols-2 gap-4">
        {report.opportunities?.map((opp, i) => (
          <motion.div
            key={`${opp.title}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-dark-800 border border-white/5 p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  {opp.title}
                </h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
                  {opp.category}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">{opp.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-xs text-gray-500">Estimated / month</span>
              <span className="text-base font-bold text-green-400">
                {formatMoney(opp.estimated_monthly_savings, currency)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {report.window_days && (
        <p className="text-center text-xs text-gray-500">
          Based on the last {report.window_days} days of spending.
        </p>
      )}
    </div>
  );
}
