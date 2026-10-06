import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation landing route.
 * Supabase redirects here with ?code=... after a successful Google
 * sign-in or email confirmation. We exchange it for a session cookie,
 * then forward the user to ?next or /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fall through on failure → back to login with a hint
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Sign in failed, please try again.")}`,
  );
}
