// Small helpers for showing who's signed in.

/** One or two letters for the avatar: initials of the name, else the email's first letter. */
export function initials(name: string | null | undefined, email: string): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

/** The name to show, falling back to the part of the email before the @. */
export function displayName(name: string | null | undefined, email: string): string {
  return name?.trim() || email.split("@")[0];
}
