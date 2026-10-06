"use client";

import { createClient } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;          // any JSON-serializable value
  form?: FormData;         // for file uploads — skips JSON handling
};

/**
 * Authenticated fetch to the FastAPI backend.
 * Pulls the Supabase access token from the current session and
 * attaches it as `Authorization: Bearer <token>`.
 *
 * Usage:
 *   const me = await api<CurrentUser>("/auth/me");
 *   const res = await api("/upload", { form: formData });
 */
export async function api<T = unknown>(
  path: string,
  opts: Options = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(opts.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // browser sets multipart boundary
  } else if (opts.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    body,
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text();
    }
    const msg =
      (errBody as { detail?: string })?.detail ??
      `Request failed: ${res.status}`;
    throw new ApiError(res.status, msg, errBody);
  }

  // Handle 204 / empty body gracefully
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
