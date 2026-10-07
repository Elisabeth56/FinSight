/** Where to go after signing in: a path on this site, or the dashboard. Stops open redirects. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
