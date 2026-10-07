"use client";

import { authClient } from "@/lib/auth/client";

// Neon Auth JWTs live 15 minutes; reuse one until a minute before it expires
const REFRESH_MARGIN_SECONDS = 60;
let cached: { token: string; exp: number } | null = null;

/** The signed-in user's JWT for API calls, or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  if (cached && cached.exp - REFRESH_MARGIN_SECONDS > Date.now() / 1000) return cached.token;
  try {
    const { data } = await authClient.token();
    cached = data?.token ? { token: data.token, exp: tokenExpiry(data.token) } : null;
  } catch {
    // auth isn't reachable or configured in this environment
    cached = null;
  }
  return cached?.token ?? null;
}

/** Drops the cached token, so the next call asks again. Call on sign-out. */
export function forgetAccessToken() {
  cached = null;
}

/** The token's `exp` claim in seconds, or 0 if it can't be read (forces a refetch). */
export function tokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(payload)).exp) || 0;
  } catch {
    return 0;
  }
}
