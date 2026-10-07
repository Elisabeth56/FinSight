import Link from "next/link";

import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-paper px-4 py-8 sm:justify-center">
      <Link href="/" aria-label="FinSight home" className="mb-8">
        <Logo />
      </Link>
      <main className="w-full max-w-[420px] rounded-3xl bg-surface p-6 shadow-card sm:p-9">{children}</main>
      <Link href="/demo" prefetch={false} className="mt-6 text-sm text-brand underline-offset-4 hover:underline">
        Just looking? Try the demo account
      </Link>
    </div>
  );
}
