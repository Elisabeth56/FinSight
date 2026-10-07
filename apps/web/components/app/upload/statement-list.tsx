"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { dayShort } from "@/lib/dates";
import type { Statement } from "@/lib/models";
import { useApi } from "@/lib/use-api";

const UNDO_MS = 5000;

/** Uploaded statements. Delete hides the row at once and only commits after the undo window. */
export function StatementList({ version }: { version: string }) {
  const { data, reload } = useApi<Statement[]>(`/statements?v=${version}`);
  const [hidden, setHidden] = useState<Statement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function remove(statement: Statement) {
    setHidden(statement);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api(`/statements/${statement.id}`, { method: "DELETE" }).finally(() => {
        setHidden(null);
        reload();
      });
    }, UNDO_MS);
  }

  function undo() {
    clearTimeout(timer.current);
    setHidden(null);
  }

  const shown = data?.filter((s) => s.id !== hidden?.id) ?? [];
  if (!data?.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">Your statements</h2>
      <ul className="flex flex-col gap-0.5 rounded-[20px] bg-surface p-2">
        {shown.map((s) => (
          <StatementRow key={s.id} statement={s} onDelete={() => remove(s)} />
        ))}
      </ul>
      {hidden && <UndoToast name={hidden.filename} onUndo={undo} />}
    </section>
  );
}

function StatementRow({ statement, onDelete }: { statement: Statement; onDelete: () => void }) {
  const period = statement.period_start && statement.period_end ? `${dayShort(statement.period_start)} to ${dayShort(statement.period_end)}` : statement.currency;
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm">{statement.filename}</span>
        <span className="text-xs text-ink-3">
          {period} · {statement.row_count} rows
        </span>
      </span>
      <button type="button" onClick={onDelete} className="h-11 rounded-full px-4 text-sm text-ink-2 hover:bg-sunk hover:text-danger">
        Delete
      </button>
    </li>
  );
}

function UndoToast({ name, onUndo }: { name: string; onUndo: () => void }) {
  return (
    <div role="status" className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-[420px] items-center gap-3 rounded-full bg-night py-2 pr-2 pl-5 text-sm text-[#edebe6] shadow-card lg:bottom-8">
      <span className="min-w-0 flex-1 truncate">Deleted {name} and its rows</span>
      <button type="button" onClick={onUndo} className="h-9 rounded-full bg-highlight px-4 font-medium text-[#292826]">
        Undo
      </button>
    </div>
  );
}
