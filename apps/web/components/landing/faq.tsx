"use client";

import clsx from "clsx";
import { useState } from "react";

import { faqs } from "./content";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto flex max-w-[1200px] flex-wrap gap-12 px-6 pb-32">
      <h2 className="flex-[1_1_300px] text-[clamp(36px,4.4vw,52px)] leading-[1.02] font-medium tracking-[-0.03em]">
        Questions people ask first
      </h2>
      <div className="flex flex-[2_1_560px] flex-col">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-t border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-4 py-5.5 text-left"
              >
                <span className="flex-1 text-lg font-medium">{f.q}</span>
                <span
                  aria-hidden
                  className={clsx(
                    "flex size-8 items-center justify-center rounded-full text-lg transition-[transform,background-color] duration-300",
                    isOpen ? "rotate-45 bg-highlight text-[#292826]" : "bg-sunk",
                  )}
                >
                  +
                </span>
              </button>
              <div
                id={`faq-${i}`}
                className={clsx(
                  "grid transition-[grid-template-rows,opacity] duration-450 ease-out-soft",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <p className="overflow-hidden text-base leading-relaxed text-ink-2">
                  <span className="block max-w-[600px] pb-5.5">{f.a}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
