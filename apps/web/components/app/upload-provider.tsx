"use client";

// Holds the current upload above the pages, so leaving the upload screen doesn't cancel it.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";

import type { ApiError } from "@/lib/api";
import type { Statement } from "@/lib/models";
import { checkFile, sendStatement } from "@/lib/upload";

export type UploadState =
  | { phase: "idle" }
  | { phase: "sending"; name: string; progress: number }
  | { phase: "sorting"; name: string }
  | { phase: "done"; name: string; statement: Statement }
  | { phase: "failed"; name: string; error: ApiError };

type UploadContext = { state: UploadState; start: (file: File) => void; reset: () => void };

const Context = createContext<UploadContext | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadState>({ phase: "idle" });

  const start = useCallback((file: File) => {
    const name = file.name;
    const invalid = checkFile(file);
    if (invalid) return setState({ phase: "failed", name, error: invalid });

    setState({ phase: "sending", name, progress: 0 });
    sendStatement(
      file,
      (progress) => setState((s) => (s.phase === "sending" ? { ...s, progress } : s)),
      () => setState({ phase: "sorting", name }),
    )
      .then((statement) => setState({ phase: "done", name, statement }))
      .catch((error: ApiError) => setState({ phase: "failed", name, error }));
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return (
    <Context.Provider value={{ state, start, reset }}>
      {children}
      <BackgroundPill state={state} />
    </Context.Provider>
  );
}

export function useUpload(): UploadContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useUpload must be used inside UploadProvider");
  return ctx;
}

/** A small status pill on other pages while an upload runs, and once it's finished. */
function BackgroundPill({ state }: { state: UploadState }) {
  const pathname = usePathname();
  if (state.phase === "idle" || pathname === "/dashboard/upload") return null;

  const label = {
    sending: "Sending your statement",
    sorting: "Sorting your statement",
    done: state.phase === "done" ? `${state.statement.row_count} rows sorted` : "",
    failed: "Upload needs a look",
  }[state.phase];

  return (
    <Link
      href="/dashboard/upload"
      role="status"
      className="fixed right-4 bottom-24 z-30 inline-flex h-11 items-center gap-2.5 rounded-full bg-surface pr-4 pl-3.5 text-sm shadow-card lg:right-8 lg:bottom-8"
    >
      <span className={state.phase === "done" ? "size-2 rounded-full bg-brand" : "size-2 animate-pulse-dot rounded-full bg-highlight"} />
      {label}
      <span className="text-brand">View</span>
    </Link>
  );
}
