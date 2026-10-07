"use client";

// The Pro savings report. It costs an AI call, so it's made on request and the last one is
// kept in this browser until the person asks for a fresh one.
import { useState } from "react";

import { ErrorCard } from "@/components/app/states";
import { Button, LinkButton } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { api, ApiError } from "@/lib/api";
import type { Me, SavingsReport } from "@/lib/models";
import { money } from "@/lib/money";
import { useApi } from "@/lib/use-api";
import { useStoredState } from "@/lib/use-stored-state";

const STORE_KEY = "finsight:savings-report";

export function SavingsScreen() {
  const me = useApi<Me>("/me");
  const [stored, setStored] = useStoredState(STORE_KEY);
  const [state, setState] = useState<{ busy: boolean; error?: ApiError }>({ busy: false });
  const report = parseReport(stored);

  async function generate() {
    setState({ busy: true });
    try {
      const fresh = await api<SavingsReport>("/reports/savings", { method: "POST" });
      setStored(JSON.stringify(fresh));
      setState({ busy: false });
    } catch (error) {
      setState({ busy: false, error: error as ApiError });
    }
  }

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Savings report</h1>
        {report && me.data?.is_pro && (
          <Button variant="quiet" onClick={generate} disabled={state.busy}>{state.busy ? "Working it out" : "Make a fresh report"}</Button>
        )}
      </div>
      {state.error && <ErrorCard error={state.error} onRetry={generate} />}
      {me.data && !me.data.is_pro && <ProGate />}
      {me.data?.is_pro && !report && <FirstReport busy={state.busy} onGenerate={generate} />}
      {me.data?.is_pro && report && <Report report={report} />}
    </div>
  );
}

function parseReport(raw: string | null): SavingsReport | null {
  try {
    return raw ? (JSON.parse(raw) as SavingsReport) : null;
  } catch {
    return null;
  }
}

function FirstReport({ busy, onGenerate }: { busy: boolean; onGenerate: () => void }) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-3xl bg-surface p-7">
      <p className="max-w-[520px] text-[15px] leading-relaxed text-ink-2">
        FinSight looks at your last 90 days, picks the few cuts that would make the most difference, and works out
        the naira from your own rows.
      </p>
      <Button variant="action" onClick={onGenerate} disabled={busy}>
        {busy ? "Reading 90 days of spending" : "Make my report"}
      </Button>
    </section>
  );
}

function Report({ report }: { report: SavingsReport }) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-surface p-6 sm:p-8">
      <span className="text-xs text-ink-3">Last {report.window_days} days</span>
      <h2 className="font-figure text-[40px] leading-[1.05] sm:text-[52px]">
        Save about <Highlight>{money(report.total_saving_minor, report.currency)}</Highlight> a month
      </h2>
      <p className="max-w-[620px] text-[15px] leading-relaxed text-ink-2">{report.summary}</p>
      <ul className="flex flex-col gap-1">
        {report.opportunities.map((o) => (
          <li key={o.title} className="flex flex-col gap-1 rounded-2xl px-1 py-3 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">{o.title}</span>
              <span className="text-sm leading-relaxed text-ink-2">{o.description}</span>
              <span className="text-xs text-ink-3">
                {o.target} · now {money(o.monthly_minor, report.currency)} a month
              </span>
            </div>
            <span className="font-figure text-2xl tabular-nums text-income">{money(o.saving_minor, report.currency)}</span>
          </li>
        ))}
      </ul>
      <span className="text-xs text-ink-3">Amounts are worked out from your rows, not guessed by the AI.</span>
    </section>
  );
}

/** Free users see what the report looks like, blurred, with one way in. */
function ProGate() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-surface">
      <div aria-hidden className="flex flex-col gap-4 p-8 blur-[6px] select-none">
        <span className="font-figure text-5xl">Save about ₦38,000 a month</span>
        {["Cook 4 of the 11 delivery nights", "Drop the plan you don't use", "Take the bus twice a week"].map((t) => (
          <div key={t} className="flex justify-between gap-4 text-sm text-ink-2">
            <span>{t}</span>
            <span>₦12,000</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/50 p-6 text-center">
        <span className="text-lg font-medium">The savings report is part of Pro</span>
        <span className="max-w-[380px] text-sm text-ink-2">Specific cuts tied to your own rows, with the naira worked out. From ₦4,500 for a month.</span>
        <LinkButton href="/dashboard/billing" variant="highlight">See Pro</LinkButton>
      </div>
    </section>
  );
}
