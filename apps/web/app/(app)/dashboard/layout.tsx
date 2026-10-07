"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    api<CurrentUser>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar user={user} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
