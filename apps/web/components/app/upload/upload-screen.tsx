"use client";

import { ErrorCard } from "@/components/app/states";
import { DropZone } from "@/components/app/upload/drop-zone";
import { SortedRows, SortingRows } from "@/components/app/upload/sorted-rows";
import { StatementList } from "@/components/app/upload/statement-list";
import { UploadProgress } from "@/components/app/upload/upload-progress";
import { useUpload } from "@/components/app/upload-provider";

/** Pick a file, watch it get sorted, then see the rows. Errors sit above a fresh drop zone. */
export function UploadScreen() {
  const { state, start, reset } = useUpload();
  const busy = state.phase === "sending" || state.phase === "sorting" || state.phase === "done";
  // the list refreshes whenever a new statement lands
  const listVersion = state.phase === "done" ? state.statement.id : "";

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-6">
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Upload a statement</h1>
      {state.phase === "failed" && <ErrorCard error={state.error} onRetry={reset} />}
      {busy ? <UploadProgress state={state} onAnother={reset} /> : <DropZone onFile={start} />}
      {state.phase === "sending" || state.phase === "sorting" ? <SortingRows /> : null}
      {state.phase === "done" && <SortedRows statementId={state.statement.id} />}
      {!busy && <Tips />}
      <StatementList version={listVersion} />
    </div>
  );
}

function Tips() {
  return (
    <ul className="grid gap-3 text-sm text-ink-2 sm:grid-cols-3">
      <li className="rounded-2xl bg-surface/60 p-4">In your bank app, look for Statement or Account statement and pick PDF or CSV.</li>
      <li className="rounded-2xl bg-surface/60 p-4">Most banks email a PDF or CSV statement on request from their app.</li>
      <li className="rounded-2xl bg-surface/60 p-4">FinSight reads the rows, then discards the file.</li>
    </ul>
  );
}
