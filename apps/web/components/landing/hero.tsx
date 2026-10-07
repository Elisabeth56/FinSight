"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Arrow, LinkButton } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { links } from "@/lib/site";

import { heroRows } from "./content";

const LOOP_STEPS = 15;
const STEP_MS = 600;
const MARCH_SPENT = 284_500;
const ease = [0.22, 1, 0.36, 1] as const;
// smaller on phones so the photo makes it into the first screen
const heroButton = "sm:h-13 sm:px-6 sm:text-base";

/**
 * The photo hero. On loop: rows sort one by one, the Jumia charge gets highlighted, the
 * running total counts up and a chat answer appears. Reduced motion shows the finished state.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(8);
  const [total, setTotal] = useState(MARCH_SPENT);

  useEffect(() => {
    if (reduce) return;
    const loop = setInterval(() => setStep((s) => (s + 1) % LOOP_STEPS), STEP_MS);
    return () => clearInterval(loop);
  }, [reduce]);

  // the total eases toward the share of rows sorted so far
  useEffect(() => {
    if (reduce) return;
    const target = Math.round((MARCH_SPENT * Math.min(step, 7)) / 7);
    const tick = setInterval(() => {
      setTotal((t) => (Math.abs(target - t) < 50 ? target : t + (target - t) * 0.2));
    }, 40);
    return () => clearInterval(tick);
  }, [step, reduce]);

  const shown = reduce ? 8 : step;
  const sorted = shown >= 7;

  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-4 pt-4 pb-20 sm:gap-14 sm:px-6 sm:pt-12 sm:pb-28">
      <div className="flex flex-[1_1_400px] flex-col gap-5 sm:gap-7">
        <span className="inline-flex h-8 items-center gap-2.5 self-start rounded-full bg-surface pr-3.5 pl-2.5 text-[13px] text-ink-2">
          <span className="size-2 animate-pulse-dot rounded-full bg-highlight" />
          Built for OPay and Nigerian bank statements
        </span>
        <h1 className="text-[clamp(48px,6.4vw,76px)] leading-[0.98] font-medium tracking-[-0.035em]">
          Your bank statement,{" "}
          <Highlight>
            <span className="font-figure tracking-[-0.01em] italic">read properly.</span>
          </Highlight>
        </h1>
        <p className="max-w-[460px] text-base leading-relaxed sm:text-lg text-ink-2">
          Drop in the PDF or CSV your bank already gives you. FinSight sorts every line, flags
          what looks off, and answers questions with the exact figures.
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={links.demo} className={heroButton}>
            Try the demo <Arrow />
          </LinkButton>
          <LinkButton href={links.signUp} variant="secondary" className={heroButton}>
            Upload a statement
          </LinkButton>
        </div>
        <p className="hidden flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-3 sm:flex">
          <span>No bank login</span>
          <span aria-hidden>·</span>
          <span>PDF or CSV</span>
          <span aria-hidden>·</span>
          <span>Every answer shows its rows</span>
        </p>
      </div>

      <figure className="relative m-0 h-[520px] min-w-0 flex-[1.15_1_480px] overflow-hidden rounded-[32px] bg-sunk sm:h-[660px]">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease }}
        >
          <Image
            src="/hero-statement.webp"
            alt="A printed bank statement on a wooden table, a hand holding a pencil beside a cup of tea and a phone, in morning light"
            fill
            priority
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        </motion.div>

        <div className="absolute top-5 left-5 inline-flex h-10 items-center gap-2.5 rounded-full bg-[#faf9f7]/95 pr-4 pl-3 text-[13px] text-[#292826] shadow-card">
          <span className="size-2 rounded-full bg-[#1f5a43]" />
          <span className="text-[#6b6966]">March spent</span>
          <span className="font-semibold tabular-nums">
            ₦{(Math.round((reduce ? MARCH_SPENT : total) / 100) * 100).toLocaleString("en-NG")}
          </span>
        </div>

        <motion.div
          aria-hidden={shown < 8}
          className="absolute top-[76px] right-5 flex max-w-[260px] flex-col gap-2 text-[13px] leading-snug"
          animate={{ opacity: shown >= 8 ? 1 : 0, y: shown >= 8 ? 0 : 10 }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="self-end rounded-[18px_18px_6px_18px] bg-[#292826] px-3.5 py-2.5 text-[#faf9f7]">
            Where did most of it go?
          </span>
          <span className="rounded-[18px_18px_18px_6px] bg-[#faf9f7]/97 px-3.5 py-3 text-[#292826] shadow-card">
            Food,{" "}
            <mark className="rounded bg-[#ffcf4a] px-1 font-semibold text-[#292826]">₦92,300</mark>.
            About a third of March.
          </span>
        </motion.div>

        <figcaption className="absolute inset-x-3 bottom-3 flex sm:inset-x-5 sm:bottom-5 flex-col gap-0.5 rounded-3xl bg-[#faf9f7]/96 p-3.5 text-[#292826] shadow-card">
          <div className="flex items-center justify-between px-2 pt-0.5 pb-2 text-xs text-[#6b6966]">
            <span>opay_statement_march.pdf</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={clsx("size-1.5 rounded-full", sorted ? "bg-[#1f5a43]" : "bg-[#ffcf4a]")} />
              {sorted ? "48 rows sorted" : "Sorting rows"}
            </span>
          </div>
          {heroRows.map((row, i) => {
            const done = shown > i + 1;
            const flagged = Boolean(row.flag) && shown >= 7;
            return (
              <div key={row.desc} className="relative flex items-center gap-3 overflow-hidden rounded-xl px-2 py-2.5">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left rounded-xl bg-[#ffe9a3]"
                  animate={{ scaleX: flagged ? 1 : 0 }}
                  transition={{ duration: 0.7, ease }}
                />
                <span className="relative hidden w-11 shrink-0 text-xs sm:block text-[#6b6966]">{row.date}</span>
                <span className="relative min-w-0 flex-1 truncate text-sm">{row.desc}</span>
                <span className="relative h-6 w-[76px] shrink-0 sm:w-[120px]">
                  <span
                    className={clsx(
                      "absolute top-0 right-0 h-6 w-[72px] rounded-full bg-[#e8e6e2] transition-opacity",
                      done && "opacity-0",
                    )}
                  />
                  <motion.span
                    className={clsx(
                      "absolute top-0 right-0 inline-flex h-6 items-center rounded-full px-2.5 text-xs whitespace-nowrap",
                      flagged ? "bg-[#ffcf4a] text-[#292826]" : "bg-[#e8e6e2] text-[#54524f]",
                    )}
                    animate={{ opacity: done ? 1 : 0, y: done ? 0 : 6, scale: done ? 1 : 0.9 }}
                    transition={{ duration: 0.5, ease }}
                  >
                    {flagged ? (
                      <>
                        Unusual<span className="hidden sm:inline">&nbsp;· 3× usual</span>
                      </>
                    ) : (
                      row.cat
                    )}
                  </motion.span>
                </span>
                <span
                  className={clsx(
                    "relative w-[72px] shrink-0 text-right sm:w-[84px] text-sm tabular-nums",
                    row.amt.startsWith("+") && "text-[#2f6b4f]",
                  )}
                >
                  {row.amt}
                </span>
              </div>
            );
          })}
        </figcaption>
      </figure>
    </section>
  );
}
