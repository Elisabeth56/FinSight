"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

/* ---------- panel: a consistent card for dashboard sections ---------- */
export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl bg-dark-800 border border-white/5 p-6 ${className}`}
    >
      {(title || right) && (
        <div className="flex items-start justify-between mb-5">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/* ---------- empty state shown when no statement has been uploaded ---------- */
export function NoDataEmpty({
  title = "No statements yet",
  hint = "Upload a CSV or PDF bank statement to unlock your dashboard.",
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-dark-800 border border-dashed border-white/10 p-12 text-center"
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
        <Upload className="w-6 h-6 text-green-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">{hint}</p>
      <Link
        href="/dashboard/upload"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium hover:from-green-400 hover:to-emerald-300 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Upload statement
      </Link>
    </motion.div>
  );
}
