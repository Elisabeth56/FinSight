"use client";

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";

type Result<T> = { path: string; data?: T; error?: ApiError };

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
