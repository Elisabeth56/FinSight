"use client";

import { getAccessToken } from "@/lib/auth/token";

// Always same-origin: the web server forwards /api/* to the API, so there's no CORS. Not read from
// env on purpose; a leftover NEXT_PUBLIC_API_URL once sent production traffic to a dead host.
export const API_URL = "/api";

/** The API's one error shape: {error: {code, message, details}}. `message` is safe to show. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  form?: FormData;
};

export async function authHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Authenticated request to the API. Throws ApiError with a message fit for the screen. */
export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  for (const [k, v] of Object.entries(await authHeader())) headers.set(k, v);

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...opts, headers, body });
  } catch {
    throw new ApiError(0, "offline", "We couldn't reach FinSight. Check your connection and try again.");
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(res: Response): Promise<ApiError> {
  return parseApiError(res.status, await res.text().catch(() => ""));
}

/** Reads the API's error shape from a response body, or falls back to a calm generic message. */
export function parseApiError(status: number, text: string): ApiError {
  try {
    const { error } = JSON.parse(text);
    if (error?.code && error?.message) return new ApiError(status, error.code, error.message, error.details);
  } catch {
    // not our JSON shape: fall through to a generic message
  }
  return new ApiError(status, "unexpected", "Something went wrong on our side. Try again in a moment.");
}
