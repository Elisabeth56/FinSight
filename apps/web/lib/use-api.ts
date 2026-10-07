"use client";

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";

type Result<T> = { path: string; data?: T; error?: ApiError };

const INVALIDATE = "finsight:invalidate";

/** Tells every useApi showing `path` to fetch it again, e.g. the sidebar after a profile edit. */
export function invalidate(path: string) {
  window.dispatchEvent(new CustomEvent(INVALIDATE, { detail: path }));
}

/**
 * GETs `path` from the API and keeps the result. Pass null to skip. A new path starts a fresh
 * load; `reload` refetches the current one.
 */
export function useApi<T>(path: string | null) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!path) return;
    let live = true;
    api<T>(path)
      .then((data) => live && setResult({ path, data }))
      .catch((error) => live && setResult({ path, error: toApiError(error) }));
    return () => {
      live = false;
    };
  }, [path, attempt]);

  // refetch quietly when another screen changed this resource; the old data stays up meanwhile
  useEffect(() => {
    const onInvalidate = (e: Event) => (e as CustomEvent<string>).detail === path && setAttempt((n) => n + 1);
    window.addEventListener(INVALIDATE, onInvalidate);
    return () => window.removeEventListener(INVALIDATE, onInvalidate);
  }, [path]);

  const reload = useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);

  const current = result?.path === path ? result : null;
  return { data: current?.data, error: current?.error, loading: Boolean(path) && !current, reload };
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, "unexpected", "Something went wrong on our side. Try again in a moment.");
}
