"use client";

import clsx from "clsx";
import { useRef, useState } from "react";

/** Drop a file or click to pick one. Keyboard: Enter or Space opens the picker. */
export function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function drop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={clsx(
        "flex h-60 w-full flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] border-dashed text-center transition-colors duration-200 ease-ui",
        over ? "border-brand bg-action/40" : "border-ink/20 bg-surface hover:bg-surface/70",
      )}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 15V3" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 21h14" />
      </svg>
      <span className="text-base">{over ? "Let go to upload" : "Drop a PDF or CSV here, or choose a file"}</span>
      <span className="text-xs text-ink-3">Up to 4 MB. Export it from your bank app or email.</span>
      <input
        ref={input}
        type="file"
        accept=".pdf,.csv,application/pdf,text/csv"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </button>
  );
}
