// Plain-language copy for auth failures. The Neon Auth SDK normalizes errors to these codes,
// and our own ?error= hints use the same table.

const messages: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Check them and try again.",
  user_already_exists: "There's already an account with that email. Sign in instead.",
  email_exists: "There's already an account with that email. Sign in instead.",
  weak_password: "Use at least 8 characters for your password.",
  email_address_invalid: "That email address doesn't look right.",
  over_request_rate_limit: "Too many tries. Wait a minute, then try again.",
  demo_unavailable: "The demo account isn't available right now. Try again in a minute.",
};

const fallback = "We couldn't sign you in. Try again in a moment.";

type Coded = { code?: string } | null | undefined;

/** A message fit for the screen, from an auth error code (or null when there's nothing to show). */
export function authMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return messages[code] ?? fallback;
}

/**
 * Runs an auth call and returns a message if it failed, or null if it worked.
 * The SDK throws on HTTP errors instead of returning them, so both paths are handled here.
 */
export async function authFailure(call: () => Promise<{ error?: Coded } | unknown>): Promise<string | null> {
  try {
    const result = (await call()) as { error?: Coded } | undefined;
    return result?.error ? authMessage(result.error.code ?? "unknown") : null;
  } catch (e) {
    return authMessage((e as Coded)?.code ?? "unknown");
  }
}
