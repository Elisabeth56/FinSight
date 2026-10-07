"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const PRO_FEATURES = [
  "Unlimited statement uploads",
  "AI-powered savings report",
  "Full chat history",
  "Priority processing",
];

export function PaywallModal({
  open,
  onClose,
  title = "Upgrade to Pro",
  message = "You've reached the limits of the free plan. Pro unlocks unlimited uploads and the full savings report.",
}: PaywallModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-dark-800 border border-white/10 overflow-hidden"
          >
            {/* decorative glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-dark-900" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
              <p className="text-sm text-gray-400 mb-6">{message}</p>

              <ul className="space-y-2 mb-6">
                {PRO_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClose();
                    router.push("/dashboard/billing");
                  }}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium hover:from-green-400 hover:to-emerald-300 transition-colors"
                >
                  See plans
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------- */
/** Narrow helper: is this caught error a 402 paywall response? */
export function isPaywallError(
  err: unknown,
): err is { status: 402; body: { error: string; message: string } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: unknown }).status === 402
  );
}
