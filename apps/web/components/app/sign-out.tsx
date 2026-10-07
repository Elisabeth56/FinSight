"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { forgetAccessToken } from "@/lib/auth/token";

/** Ends the session and goes back to the landing page. */
export function SignOut({ className }: { className?: string }) {
  const router = useRouter();
  async function signOut() {
    forgetAccessToken();
    // leave either way: a failed call still leaves a session that expires on its own
    await authClient.signOut().catch(() => null);
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={signOut} className={clsx("h-11 rounded-full text-sm text-ink-3 hover:text-ink", className)}>
      Sign out
    </button>
  );
}
