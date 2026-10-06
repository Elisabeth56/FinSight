"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Receipt,
  MessageSquare,
  Sparkles,
  LogOut,
  TrendingUp,
  Menu,
  X,
  CreditCard,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/types";

type NavItem = { name: string; href: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/dashboard/upload", icon: Upload },
  { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Savings", href: "/dashboard/savings", icon: Sparkles },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export function Sidebar({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ===== mobile topbar ===== */}
      <div className="lg:hidden sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">FinSight</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ===== desktop sidebar ===== */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-dark-800 border-r border-white/5">
        <SidebarContent
          pathname={pathname}
          user={user}
          onSignOut={signOut}
          onNav={() => {}}
        />
      </aside>

      {/* ===== mobile drawer ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-dark-800 border-r border-white/5 z-50"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent
                pathname={pathname}
                user={user}
                onSignOut={signOut}
                onNav={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname,
  user,
  onSignOut,
  onNav,
}: {
  pathname: string;
  user: CurrentUser | null;
  onSignOut: () => void;
  onNav: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* logo */}
      <div className="px-6 h-16 flex items-center border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">FinSight</span>
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${
                  active
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* user card + sign out */}
      <div className="p-3 border-t border-white/5 space-y-2">
        {user && user.plan === "free" && (
          <Link
            href="/dashboard/billing"
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 text-sm font-medium hover:from-green-400 hover:to-emerald-300 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro
          </Link>
        )}
        {user && (
          <div className="px-3 py-2 rounded-lg bg-dark-700/50 border border-white/5">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm text-white font-medium truncate">
                {user.full_name || user.email.split("@")[0]}
              </p>
              {user.plan === "pro" ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-400/20 text-green-400 text-[10px] font-medium uppercase border border-green-500/20">
                  <Zap className="w-2.5 h-2.5" />
                  Pro
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 text-[10px] font-medium uppercase">
                  Free
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate block">
              {user.email}
            </span>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
