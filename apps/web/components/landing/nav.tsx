import Link from "next/link";

import { Arrow, LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { links } from "@/lib/site";

const sections = [
  { href: "#features", label: "Features" },
  { href: "#ask", label: "Ask your money" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/** Floating pill nav: section links get a highlighter swipe on hover. */
export function Nav() {
  return (
    <header className="sticky top-0 z-30 flex justify-center px-4 pt-4">
      <nav
        aria-label="Main"
        className="flex w-full max-w-[1040px] flex-wrap items-center gap-1 rounded-full bg-surface/95 py-1.5 pr-1.5 pl-4 shadow-card backdrop-saturate-150"
      >
        <Link href="/" aria-label="FinSight home" className="mr-auto flex h-11 items-center">
          <Logo />
        </Link>
        <div className="hidden items-center md:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="swipe flex h-11 items-center px-3.5 text-sm text-ink">
              {s.label}
            </a>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
        </div>
        <Link href={links.signIn} className="hidden h-11 items-center px-3.5 text-sm text-ink sm:flex">
          Sign in
        </Link>
        <LinkButton href={links.demo}>
          Try the demo <Arrow />
        </LinkButton>
      </nav>
    </header>
  );
}
