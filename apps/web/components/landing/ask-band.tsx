"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { questions } from "./content";

const TYPE_MS = 45;
const HOLD_MS = 3600;

/** A charcoal band where questions type themselves out and answers fade up. */
export function AskBand() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(reduce ? 999 : 0);
  const q = questions[index];
  const typed = chars >= q.ask.length;

  useEffect(() => {
    if (reduce) return;
    const wait = typed ? HOLD_MS : TYPE_MS;
    const next = setTimeout(() => {
      if (!typed) return setChars((c) => c + 1);
      setIndex((i) => (i + 1) % questions.length);
      setChars(0);
    }, wait);
    return () => clearTimeout(next);
  }, [chars, typed, reduce]);

  return (
    <section
      id="ask"
      className="relative mx-auto flex max-w-[1152px] flex-wrap items-center gap-12 overflow-hidden rounded-[40px] bg-[#292826] p-[clamp(32px,6vw,72px)] text-[#faf9f7] max-[1200px]:mx-6"
    >
      <span aria-hidden className="absolute -top-30 -right-30 size-90 rounded-full border border-white/8" />
      <span aria-hidden className="absolute -top-10 -right-10 size-50 rounded-full border border-white/8" />
      <div className="relative flex flex-[1_1_340px] flex-col gap-5">
        <span className="text-[13px] tracking-[0.02em] text-[#ffcf4a]">Ask your money</span>
        <h2 className="text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
          Questions in plain words. Answers in{" "}
          <span className="font-figure font-normal text-[#ffcf4a] italic">exact naira.</span>
        </h2>
        <p className="max-w-[420px] text-[17px] leading-relaxed text-white/70">
          FinSight adds the numbers up in the database, then explains them. The model never does
          the maths, so totals always match your statement.
        </p>
      </div>

      <div
        aria-live="polite"
        className="relative flex min-h-[300px] min-w-0 flex-[1.1_1_420px] flex-col gap-3.5 rounded-[28px] border border-white/10 bg-white/6 p-5"
      >
        <div className="max-w-[85%] self-end rounded-[20px_20px_6px_20px] bg-[#faf9f7] px-4 py-3 text-[15px] leading-snug text-[#292826]">
          {reduce ? q.ask : q.ask.slice(0, chars)}
          <span aria-hidden className="ml-0.5 inline-block h-4 w-0.5 animate-caret bg-[#1f5a43] align-[-2px]" />
        </div>
        <motion.div
          className="max-w-[92%] rounded-[20px_20px_20px_6px] bg-white/10 px-4.5 py-4 text-[15px] leading-relaxed"
          animate={{ opacity: typed ? 1 : 0, y: typed ? 0 : 8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {q.lead}{" "}
          <mark className="rounded-[5px] bg-[#ffcf4a] px-1.5 py-px font-semibold text-[#292826]">{q.figure}</mark>
          {q.tail.startsWith(",") ? q.tail : ` ${q.tail}`}
        </motion.div>
        <motion.div
          className="mt-auto flex flex-wrap gap-2"
          animate={{ opacity: typed ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {q.sources.map((s) => (
            <span key={s} className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-xs text-white/80">
              {s}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
