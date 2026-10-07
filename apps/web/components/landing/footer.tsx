import Link from "next/link";

import { LogoMark } from "@/components/ui/logo";
import { links } from "@/lib/site";

const columns = [
  {
    title: "Product",
    items: [
      ["Features", "#features"],
      ["Ask your money", "#ask"],
      ["Pricing", "#pricing"],
      ["Demo account", links.demo],
    ],
  },
  {
    title: "Project",
    items: [
      ["GitHub", links.github],
      ["How it's built", links.architecture],
      ["Design decisions", links.decisions],
      ["AI quality results", links.evals],
    ],
  },
  {
    title: "Help",
    items: [
      ["FAQ", "#faq"],
      ["Your data", "#privacy"],
      ["Sign in", links.signIn],
      ["Contact", links.contact],
    ],
  },
];

export function Footer() {
  return (
    <footer className="overflow-hidden rounded-t-[40px] bg-[#1c1c1a] px-6 pt-18 text-[#edebe6]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-14">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="flex max-w-[380px] flex-[1_1_300px] flex-col gap-4.5">
            <span className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <span className="text-lg font-semibold">FinSight</span>
            </span>
            <p className="text-[15px] leading-relaxed text-[#bdbab4]">
              Bank statements, read properly. Built for people whose banks don&apos;t connect to
              anything.
            </p>
          </div>
          <div className="grid flex-[2_1_520px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3 text-[15px]">
                <span className="text-xs tracking-[0.04em] text-[#8e8b85] uppercase">{col.title}</span>
                {col.items.map(([label, href]) =>
                  href.startsWith("/") ? (
                    <Link key={label} href={href} className="text-[#bdbab4] transition-colors hover:text-[#ffcf4a]">
                      {label}
                    </Link>
                  ) : (
                    <a key={label} href={href} className="text-[#bdbab4] transition-colors hover:text-[#ffcf4a]">
                      {label}
                    </a>
                  ),
                )}
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-white/10 py-6 text-[13px] text-[#8e8b85]">
          <span>
            © 2026 FinSight. Designed and built by{" "}
            <a href={links.github} className="text-[#edebe6] hover:text-[#ffcf4a]">
              Elisabeth Nnamani
            </a>
            .
          </span>
          <span>Payments by Paystack · AI by Groq</span>
        </div>
      </div>
      <div
        aria-hidden
        className="flex translate-y-[14%] justify-center font-figure text-[clamp(120px,19vw,280px)] leading-[0.78] tracking-[-0.02em] whitespace-nowrap text-[#262624] select-none"
      >
        FinSight<span className="text-[#ffcf4a]">.</span>
      </div>
    </footer>
  );
}
