"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { statementLines, ticker } from "./content";

const FLIP_MS = 4200;
const ease = [0.22, 1, 0.36, 1] as const;

/** The problem, shown: bank narrations as printed vs as FinSight reads them. Flips itself
 * until someone uses the switch; a highlighter scan sweeps the rows on each conversion. */
export function RawVsRead() {
  const reduce = useReducedMotion();
  const [raw, setRaw] = useState(true);
  const [scanKey, setScanKey] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    if (reduce || touched.current) return;
    const flip = setTimeout(() => {
      if (raw) setScanKey((k) => k + 1);
      setRaw(!raw);
    }, FLIP_MS);
    return () => clearTimeout(flip);
  }, [raw, reduce]);

  function show(nextRaw: boolean) {
    if (raw && !nextRaw) setScanKey((k) => k + 1);
    setRaw(nextRaw);
  }

  function choose(nextRaw: boolean) {
    touched.current = true;
    show(nextRaw);
  }

  return (
    <section aria-labelledby="raw-title" className="overflow-hidden bg-surface pb-28">
      <div aria-hidden className="mb-24 overflow-hidden border-y border-line bg-paper/60 py-4.5">
        <div className="flex w-max animate-drift gap-3">
          {[...ticker, ...ticker].map(([text, read], i) => (
            <span
              key={i}
              className={clsx(
                "inline-flex h-9 items-center gap-2.5 rounded-full px-3.5 text-[13px] whitespace-nowrap",
                read ? "bg-surface font-sans text-ink" : "font-mono text-ink-3",
              )}
            >
              <span className={clsx("size-1.5 rounded-full", read ? "bg-highlight" : "bg-ink-4")} />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-6">
        <div className="flex flex-[1_1_360px] flex-col gap-5">
          <span className="text-[13px] tracking-[0.02em] text-brand">The problem</span>
          <h2 id="raw-title" className="text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
            Your bank app shows a list. It never says where the money went.
          </h2>
          <p className="max-w-[440px] text-[17px] leading-relaxed text-ink-2">
            Narrations like TRF/NIP/FBN are written for the bank&apos;s systems, not for you. Flip
            the switch to see the same five lines after FinSight reads them.
          </p>
          <div role="group" aria-label="Statement view" className="flex self-start rounded-full bg-sunk p-1">
            <button
              type="button"
              aria-pressed={raw}
              onClick={() => choose(true)}
              className={clsx(
                "h-11 rounded-full px-5 text-sm transition-colors",
                raw ? "bg-ink text-paper" : "text-ink-2",
              )}
            >
              As your bank prints it
            </button>
            <button
              type="button"
              aria-pressed={!raw}
              onClick={() => choose(false)}
              className={clsx(
                "h-11 rounded-full px-5 text-sm transition-colors",
                !raw ? "bg-brand text-on-brand" : "text-ink-2",
              )}
            >
              Read by FinSight
            </button>
          </div>
        </div>

        <div
          className={clsx(
            "relative flex min-w-0 flex-[1.2_1_480px] flex-col gap-1 overflow-hidden rounded-[28px] p-4 pt-14 transition-colors duration-400",
            raw ? "bg-sunk/70" : "bg-paper",
          )}
        >
          <span
            className={clsx(
              "absolute top-3.5 right-4.5 z-10 inline-flex h-7 items-center rounded-full px-3 text-xs transition-colors",
              raw ? "bg-sunk text-ink-2" : "bg-brand text-on-brand",
            )}
          >
            {raw ? "As printed" : "Read by FinSight"}
          </span>
          {!reduce && (
            <motion.span
              key={scanKey}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-10 h-14 bg-[linear-gradient(180deg,transparent,rgb(255_207_74/0.55),transparent)]"
              initial={{ top: "0%", opacity: scanKey ? 1 : 0 }}
              animate={{ top: "100%", opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            />
          )}
          {statementLines.map((line, i) => (
            <div
              key={line.raw}
              className={clsx(
                "flex min-h-16 items-center gap-3.5 rounded-2xl px-3.5 py-2.5 transition-colors duration-400",
                raw ? "bg-transparent" : line.flag ? "bg-highlight-soft" : "bg-surface",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={clsx("truncate", raw ? "font-mono text-[13px] text-ink-3" : "text-[15px] text-ink")}>
                  {raw ? line.raw : line.name}
                </span>
                <span className={clsx("text-xs text-ink-3 transition-opacity", raw && "opacity-0")}>{line.sub}</span>
              </div>
              <motion.span
                className={clsx(
                  "inline-flex h-6.5 shrink-0 items-center rounded-full px-3 text-xs text-[#292826]",
                  line.flag ? "bg-highlight" : "bg-sunk text-ink",
                )}
                animate={{ opacity: raw ? 0 : 1, scale: raw ? 0.85 : 1 }}
                transition={{ duration: 0.45, ease, delay: raw ? 0 : i * 0.08 }}
              >
                {line.chip}
              </motion.span>
              <span
                className={clsx(
                  "w-24 shrink-0 text-right text-sm tabular-nums",
                  raw ? "font-mono text-ink-3" : "text-ink",
                )}
              >
                {raw ? line.rawAmt : line.amt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
