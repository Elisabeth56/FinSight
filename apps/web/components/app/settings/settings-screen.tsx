"use client";

// Profile and account: the name FinSight greets you by, the email you sign in with, your plan.
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Avatar } from "@/components/app/avatar";
import { SignOut } from "@/components/app/sign-out";
import { ErrorCard } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import type { Me } from "@/lib/models";
import { displayName } from "@/lib/profile";
import { invalidate, useApi } from "@/lib/use-api";

export function SettingsScreen() {
  const me = useApi<Me>("/me");
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Settings</h1>
      {me.error && <ErrorCard error={me.error} onRetry={me.reload} />}
      {!me.data && !me.error && <Skeleton className="h-64 rounded-[20px]" />}
      {me.data && (
        <>
          <ProfileCard me={me.data} />
          <PlanCard me={me.data} />
          <section className="flex items-center justify-between gap-4 rounded-[20px] bg-surface px-6 py-4">
            <span className="min-w-0 truncate text-sm text-ink-2">Signed in as {me.data.email}</span>
            <SignOut className="shrink-0 px-3 whitespace-nowrap text-ink-2" />
          </section>
        </>
      )}
    </div>
  );
}

function ProfileCard({ me }: { me: Me }) {
  const [name, setName] = useState(me.full_name ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const changed = name.trim() !== (me.full_name ?? "") && name.trim() !== "";

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("saving");
    try {
      await api<Me>("/me", { method: "PATCH", body: { full_name: name.trim() } });
      setState("saved");
      invalidate("/me");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't save. Try again.");
      setState("idle");
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-[20px] bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <Avatar name={me.full_name} email={me.email} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-medium">{displayName(me.full_name, me.email)}</span>
          <span className="truncate text-sm text-ink-3">{me.email}</span>
        </div>
      </div>

      {me.is_demo ? (
        <p className="rounded-xl bg-sunk px-4 py-3 text-sm text-ink-2">
          This is the shared demo account, so its details stay as they are.{" "}
          <Link href="/signup" className="font-medium text-brand">
            Create your own account
          </Link>{" "}
          to upload your statements.
        </p>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          <label htmlFor="full_name" className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-2">Name</span>
            <input
              id="full_name"
              value={name}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value);
                setState("idle");
              }}
              className="h-12 rounded-md border border-line bg-paper px-4 text-[15px] text-ink focus:border-brand focus:outline-none"
            />
            <span className="text-xs text-ink-3">FinSight greets you by your first name.</span>
          </label>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-2">Email</span>
            <span className="text-ink">{me.email}</span>
            <span className="text-xs text-ink-3">You sign in with this address.</span>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!changed || state === "saving"} className="disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none">
              {state === "saving" ? "Saving…" : "Save"}
            </Button>
            {state === "saved" && (
              <span role="status" className="text-sm text-income">
                Saved
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function PlanCard({ me }: { me: Me }) {
  const until = me.pro_until && new Date(me.pro_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-surface p-6 sm:px-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-ink-3">Plan</span>
        <span className="text-[15px] font-medium">{me.is_pro ? `Pro until ${until}` : "Free"}</span>
        <span className="text-sm text-ink-2">
          {me.is_pro
            ? "Unlimited uploads and the savings report."
            : `${Math.min(me.uploads_this_month, me.upload_limit ?? 0)} of ${me.upload_limit} uploads used this month.`}
        </span>
      </div>
      <Link href="/dashboard/billing" className="text-sm font-medium text-brand">
        {me.is_pro ? "Billing" : "Get Pro"}
      </Link>
    </section>
  );
}
