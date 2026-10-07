"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** Counts from 0 to `target` once; returns `target` straight away under reduced motion. */
export function useCountUp(target: number, duration = 1.1): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, target, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return reduce ? target : value;
}
