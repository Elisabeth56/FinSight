"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo, LogoMark } from "@/components/ui/logo";
import type { Me } from "@/lib/models";
import { useApi } from "@/lib/use-api";

const nav = [
  { label: "Overview", href: "/dashboard" },
  { label: "Upload", href: "/dashboard/upload" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Chat", href: "/dashboard/chat" },
  { label: "Savings", href: "/dashboard/savings" },
  { label: "Billing", href: "/dashboard/billing" },
];

// phones get the four views people check most; upload sits in the header
const tabs = nav.filter((n) => ["Overview", "Transactions", "Chat", "Savings"].includes(n.label));

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/** Sidebar on desktop, header and bottom tabs on phones, around every app page. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-paper lg:flex">
      <Sidebar pathname={pathname} />
      <MobileHeader />
      <main className="min-w-0 flex-1 px-4 pt-4 pb-28 sm:px-8 lg:px-12 lg:pt-8 lg:pb-12">{children}</main>
      <MobileTabs pathname={pathname} />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="App" className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-1 px-4 py-6 lg:flex">
      <Link href="/dashboard" className="px-3 pt-2 pb-6" aria-label="FinSight overview">
        <Logo />
      </Link>
      {nav.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
      ))}
      <PlanCard />
    </nav>
  );
}

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-11 items-center gap-2.5 rounded-full px-3 text-sm transition-colors duration-200 ease-ui",
        active ? "bg-surface font-medium text-ink" : "text-ink-2 hover:bg-surface/60",
      )}
    >
      <span className={clsx("size-1.5 rounded-full transition-colors", active ? "bg-highlight" : "bg-transparent")} />
      {label}
    </Link>
  );
}

function PlanCard() {
  const { data: me } = useApi<Me>("/me");
  if (!me) return null;
  if (me.is_pro) {
    return (
      <div className="mt-6 flex flex-col gap-1 rounded-2xl bg-surface p-4 text-sm">
        <span className="text-xs text-ink-3">Pro</span>
        <span>Unlimited uploads{me.pro_until && ` until ${shortDate(me.pro_until)}`}</span>
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-surface p-4 text-sm">
      <span className="text-xs text-ink-3">Free plan</span>
      <span>
        {Math.min(me.uploads_this_month, me.upload_limit ?? 0)} of {me.upload_limit} uploads used this month
      </span>
      <Link href="/dashboard/billing" className="font-medium text-brand">
        Get Pro
      </Link>
    </div>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function MobileHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-4 lg:hidden">
      <Link href="/dashboard" aria-label="FinSight overview">
        <LogoMark size={30} />
      </Link>
      <Link
        href="/dashboard/upload"
        className="inline-flex h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-on-action"
      >
        Upload
      </Link>
    </header>
  );
}

function MobileTabs({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-1px_0_var(--line)] lg:hidden"
    >
      {tabs.map(({ label, href }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx("flex h-13 flex-col items-center justify-center gap-1 rounded-xl text-xs", active ? "font-medium text-ink" : "text-ink-3")}
          >
            <span className={clsx("size-1.5 rounded-full", active ? "bg-brand" : "bg-transparent")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
