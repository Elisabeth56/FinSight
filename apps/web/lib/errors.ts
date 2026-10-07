// Turns API error codes into what the screen does about them. Messages come from the API and
// are already safe to show; this only picks a title and the one action that helps.
import type { ApiError } from "@/lib/api";

export type ErrorAction = "retry" | "sign-in" | "upgrade" | "choose-file" | "wait";

type View = { title: string; action: ErrorAction };

const views: Record<string, View> = {
  not_signed_in: { title: "You're signed out", action: "sign-in" },
  session_expired: { title: "Your session ended", action: "sign-in" },
  offline: { title: "You look offline", action: "retry" },
  upload_quota_reached: { title: "You've used this month's free upload", action: "upgrade" },
  pro_required: { title: "This is part of Pro", action: "upgrade" },
  no_transactions: { title: "We couldn't find any transactions", action: "choose-file" },
  unreadable_file: { title: "We couldn't read that file", action: "choose-file" },
  unsupported_file: { title: "That file type won't work", action: "choose-file" },
  file_too_large: { title: "That file is too big", action: "choose-file" },
  empty_file: { title: "That file is empty", action: "choose-file" },
  already_uploaded: { title: "Already uploaded", action: "choose-file" },
  slow_down: { title: "One moment", action: "wait" },
  ai_busy: { title: "The AI is busy right now", action: "wait" },
};

/** Title and action for an API error; unknown codes get a calm retry. */
export function describeError(error: ApiError): View & { message: string } {
  const view = views[error.code] ?? { title: "That didn't load", action: "retry" };
  return { ...view, message: error.message };
}
