"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";

// Result shape from GET /payments/verify/{reference}
interface VerifyResult {
  ok: boolean;
  status?: string;
  message?: string;
  plan?: string;
  amount?: number;
  currency?: string;
}

function BillingCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");

  const [state, setState] = useState<
    | { kind: "verifying" }
    | { kind: "success"; result: VerifyResult }
    | { kind: "failure"; message: string }
  >({ kind: "verifying" });

  useEffect(() => {
    if (!reference) {
      setState({ kind: "failure", message: "No payment reference in URL." });
      return;
    }
    api<VerifyResult>(`/payments/verify/${reference}`)
      .then((r) => {
        if (r.ok) {
          setState({ kind: "success", result: r });
          // Auto-bounce to dashboard after 3s
          setTimeout(() => router.push("/dashboard"), 3000);
        } else {
          setState({
            kind: "failure",
            message: r.message || "Payment was not successful.",
          });
        }
      })
      .catch((e) =>
        setState({
          kind: "failure",
          message: e instanceof Error ? e.message : "Verification failed.",
        }),
      );
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 border border-white/5 rounded-2xl p-8 text-center">
        {state.kind === "verifying" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-green-400 animate-spin" />
            <h1 className="text-lg font-semibold text-white mb-1">
              Confirming your payment...
            </h1>
            <p className="text-sm text-gray-400">This only takes a moment.</p>
          </>
        )}

        {state.kind === "success" && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-lg font-semibold text-white mb-1">
              Welcome to Pro 🎉
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              {state.result.amount && state.result.currency
                ? `Paid ${state.result.currency} ${state.result.amount}. `
                : ""}
              You now have unlimited uploads and savings reports.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Redirecting to your dashboard...
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {state.kind === "failure" && (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold text-white mb-1">
              Payment not completed
            </h1>
            <p className="text-sm text-red-300 mb-6">{state.message}</p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/dashboard/billing"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium"
              >
                Try again
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white"
              >
                Back to dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900" />}>
      <BillingCallbackInner />
    </Suspense>
  );
}
