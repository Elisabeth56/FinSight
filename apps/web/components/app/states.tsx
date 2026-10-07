"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, LinkButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api";
import { describeError } from "@/lib/errors";

/** Same blocks as the overview, so nothing jumps when the figures arrive. */
export function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your overview" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex h-[148px] flex-col gap-3 rounded-[20px] bg-surface p-6 first:col-span-2 sm:first:col-span-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex h-[300px] items-end gap-4 rounded-[20px] bg-surface p-6">
          {[60, 75, 90, 55, 80, 70].map((h) => (
            <Skeleton key={h} className="flex-1 rounded-lg" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex h-[300px] flex-col justify-center gap-5 rounded-[20px] bg-surface p-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-2.5" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** First visit: nothing uploaded yet. Teaches the one step and offers the demo. */
export function EmptyOverview() {
  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-5 rounded-3xl bg-surface p-7 sm:mt-12 sm:p-9">
      <Link
        href="/dashboard/upload"
        className="flex h-48 flex-col items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-ink/20 text-center transition-colors hover:bg-sunk/50"
      >
        <UploadIcon />
        <span className="text-[15px]">Drop a PDF or CSV here</span>
        <span className="text-xs text-ink-3">Up to 4 MB</span>
      </Link>
      <h1 className="text-xl font-medium tracking-[-0.01em]">Your spending shows up here</h1>
      <p className="text-sm leading-relaxed text-ink-2">
        Export a statement from your bank app, then drop it above. It takes about a minute to sort.
      </p>
      <Link href="/demo" className="text-sm text-brand underline-offset-4 hover:underline">
        Or look around the demo account first
      </Link>
    </div>
  );
}

/** What happened and the one thing to do about it. Never shows raw error text. */
export function ErrorCard({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const router = useRouter();
  const { title, message, action } = describeError(error);
  return (
    <div role="alert" className="flex max-w-[520px] flex-col items-start gap-2.5 rounded-[20px] bg-surface p-6">
      <span className="text-[15px] font-medium">{title}</span>
      <span className="text-sm leading-relaxed text-ink-2">{message}</span>
      {action === "sign-in" && <Button className="mt-1" onClick={() => router.push("/login")}>Sign in</Button>}
      {action === "upgrade" && <LinkButton href="/dashboard/billing" variant="highlight" className="mt-1">See Pro</LinkButton>}
      {(action === "retry" || action === "wait") && <Button variant="quiet" className="mt-1" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}
