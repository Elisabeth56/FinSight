"use client";

import clsx from "clsx";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * The signature highlighter: a marigold bar that draws in behind its text the first time it
 * scrolls into view. Skewed slightly so it reads as hand-drawn.
 */
export function Highlight({
  children,
  className,
  delay = 0.3,
  tone = "strong",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  tone?: "strong" | "soft";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  return (
    <span ref={ref} className={clsx("relative z-0 inline-block whitespace-nowrap", className)}>
      <motion.span
        aria-hidden
        className={clsx(
          "absolute inset-x-[-6px] bottom-[0.12em] -z-10 h-[46%] origin-left rounded-[10px]",
          tone === "strong" ? "bg-highlight" : "bg-highlight-soft",
        )}
        style={{ skewX: -6 }}
        initial={{ scaleX: reduce ? 1 : 0 }}
        animate={{ scaleX: inView || reduce ? 1 : 0 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      {children}
    </span>
  );
}
