"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload as UploadIcon,
  X,
} from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { formatMoney, type UploadResult } from "@/lib/types";
import { Panel } from "@/components/Panel";
import { PaywallModal } from "@/components/PaywallModal";

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; filename: string }
  | { kind: "success"; result: UploadResult }
  | { kind: "error"; message: string };

const ACCEPTED = [".csv", ".pdf"];
const MAX_MB = 10;

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [paywall, setPaywall] = useState<{ open: boolean; message?: string }>({
    open: false,
  });

  const handleFile = useCallback(async (file: File) => {
    // ---- client-side validation ----
    const name = file.name.toLowerCase();
    if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
      setState({ kind: "error", message: "Only CSV and PDF files are supported." });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setState({ kind: "error", message: `File too large — max ${MAX_MB}MB.` });
      return;
    }

    setState({ kind: "uploading", filename: file.name });
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api<UploadResult>("/upload", { method: "POST", form });
      setState({ kind: "success", result });
    } catch (e) {
      // 402 from quota gate → paywall modal, not an error banner
      if (e instanceof ApiError && e.status === 402) {
        setState({ kind: "idle" });
        setPaywall({
          open: true,
          message:
            "Free plan is limited to 1 statement per month. Upgrade to Pro for unlimited uploads.",
        });
        return;
      }
      const msg =
        e instanceof ApiError ? e.message : "Upload failed. Try again.";
      setState({ kind: "error", message: msg });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Upload statement</h1>
        <p className="text-sm text-gray-400">
          CSV or PDF bank statement, up to {MAX_MB}MB. Parsing and
          categorization happen automatically.
        </p>
      </div>

      <Panel>
        <AnimatePresence mode="wait">
          {state.kind === "idle" && (
            <motion.label
              key="idle"
              htmlFor="file-input"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`block cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${
                  dragging
                    ? "border-green-500/60 bg-green-500/5"
                    : "border-white/10 hover:border-green-500/40 hover:bg-white/[0.02]"
                }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <UploadIcon className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-white font-medium mb-1">
                Drop your statement here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-600">
                Accepts CSV, PDF · {MAX_MB}MB max
              </p>
              <input
                id="file-input"
                type="file"
                accept=".csv,.pdf,text/csv,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </motion.label>
          )}

          {state.kind === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-green-400 animate-spin" />
              </div>
              <p className="text-white font-medium mb-1">
                Analyzing your statement...
              </p>
              <p className="text-sm text-gray-500 mb-4">{state.filename}</p>
              <ProcessingSteps />
            </motion.div>
          )}

          {state.kind === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 mb-3 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Statement processed
                </h3>
                <p className="text-sm text-gray-400">
                  {state.result.filename}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-2xl mx-auto">
                <Stat label="Transactions" value={state.result.transaction_count.toLocaleString()} />
                <Stat
                  label="Currency"
                  value={state.result.currency}
                />
                <Stat
                  label="Period"
                  value={
                    state.result.period_start && state.result.period_end
                      ? `${state.result.period_start} → ${state.result.period_end}`
                      : "—"
                  }
                  wide
                />
                <Stat
                  label="Anomalies"
                  value={state.result.anomaly_count.toString()}
                  accent={state.result.anomaly_count > 0}
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium hover:from-green-400 hover:to-emerald-300 transition-colors"
                >
                  Go to dashboard
                </button>
                <button
                  onClick={() => setState({ kind: "idle" })}
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Upload another
                </button>
              </div>
            </motion.div>
          )}

          {state.kind === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center py-12"
            >
              <div className="w-14 h-14 mb-3 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Upload failed
              </h3>
              <p className="text-sm text-red-300 mb-6 max-w-md">
                {state.message}
              </p>
              <button
                onClick={() => setState({ kind: "idle" })}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      {/* tips */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {[
          {
            title: "CSV format",
            body: "Must include columns for date, description, and amount (or debit/credit).",
          },
          {
            title: "PDF format",
            body: "Text-based PDFs work best. Scanned statements may need OCR first.",
          },
          {
            title: "Currency",
            body: "Auto-detected from the statement. NGN, USD, EUR, GBP, and JPY are supported.",
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl bg-dark-800 border border-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-green-400" />
              <h4 className="text-sm font-medium text-white">{tip.title}</h4>
            </div>
            <p className="text-xs text-gray-400">{tip.body}</p>
          </div>
        ))}
      </div>

      <PaywallModal
        open={paywall.open}
        onClose={() => setPaywall({ open: false })}
        title="Monthly upload limit reached"
        message={paywall.message}
      />
    </>
  );
}

/* ---------- helpers ---------- */

function Stat({
  label,
  value,
  wide,
  accent,
}: {
  label: string;
  value: string;
  wide?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-dark-700/50 border border-white/5 p-3 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-medium ${
          accent ? "text-orange-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProcessingSteps() {
  const steps = [
    "Parsing transactions",
    "Categorizing with LLaMA 3",
    "Flagging anomalies",
  ];
  return (
    <div className="space-y-1.5 text-xs text-gray-500">
      {steps.map((s, i) => (
        <motion.p
          key={s}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.6 }}
        >
          · {s}
        </motion.p>
      ))}
    </div>
  );
}
