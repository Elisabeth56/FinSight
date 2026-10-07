"use client";

import { createClient } from "@/lib/supabase/client";

/** The signed-in user's access token for API calls, or null. Neon Auth replaces this in #6. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    // auth isn't configured in this environment
    return null;
  }
}
