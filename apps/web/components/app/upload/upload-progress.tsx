"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import type { UploadState } from "@/components/app/upload-provider";
import { Button, LinkButton } from "@/components/ui/button";

type Active = Extract<UploadState, { phase: "sending" | "sorting" | "done" }>;

/** File name, live status, a progress bar and the three pipeline steps. */
export function UploadProgress({ state, onAnother }: { state: Active; onAnother: () => void }) {
  const router = useRouter();
  const done = state.phase === "done";
  return (
    <section aria-live="polite" className="flex flex-col gap-5 rounded-3xl bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{state.name}</span>
          <span className="text-sm text-ink-2">{statusLine(state)}</span>
        </div>
        {done ? (
          <div className="flex gap-2">
            <Button variant="quiet" onClick={onAnother}>Upload another</Button>
            <LinkButton href="/dashboard" variant="action">See overview</LinkButton>
          </div>
        ) : (
          <Button variant="secondary" className="border border-line" onClick={() => router.push("/dashboard")}>
            Keep browsing
          </Button>
        )}
      </div>
      <ProgressBar state={state} />
      <Steps state={state} />
    </section>
  );
}

function statusLine(state: Active): string {
  if (state.phase === "sending") return `Sending ${Math.round(state.progress * 100)}%`;
  if (state.phase === "sorting") return "Reading the rows and sorting them. This takes about a minute.";
  const { row_count, anomaly_count } = state.statement;
  return `${row_count} rows sorted${anomaly_count ? `, ${anomaly_count} highlighted` : ""}`;
}

function ProgressBar({ state }: { state: Active }) {
  // sending fills the first third; sorting has no byte count, so a band sweeps the rest
  const width = state.phase === "sending" ? state.progress * 33 : state.phase === "sorting" ? 33 : 100;
  return (
    <div role="progressbar" aria-label="Upload progress" aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100} className="relative h-2 overflow-hidden rounded-full bg-sunk">
      <motion.div className="h-2 rounded-full bg-brand" animate={{ width: `${width}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
      {state.phase === "sorting" && (
        <motion.div
          className="absolute inset-y-0 w-1/4 rounded-full bg-brand/45 motion-reduce:hidden"
          initial={{ left: "30%" }}
          animate={{ left: ["30%", "80%"] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function Steps({ state }: { state: Active }) {
  const at = { sending: 0, sorting: 1, done: 3 }[state.phase];
  const flagged = state.phase === "done" ? state.statement.anomaly_count : 0;
  const steps = [
    at > 0 ? "File received" : "Sending the file",
    "Sorting into categories",
    at > 2 ? (flagged ? `${flagged} unusual ${flagged === 1 ? "charge" : "charges"} highlighted` : "Nothing unusual found") : "Checking for unusual charges",
  ];
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {steps.map((label, i) => (
        <li key={i} className={clsx("flex items-center gap-2", i < at ? "text-income" : i === at ? "font-medium text-ink" : "text-ink-3")}>
          <span className={clsx("size-1.5 rounded-full", i < at ? "bg-income" : i === at ? "animate-pulse-dot bg-highlight" : "bg-ink-4")} />
          {label}
        </li>
      ))}
    </ol>
  );
}
