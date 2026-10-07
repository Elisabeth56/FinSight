import { createNeonAuth } from "@neondatabase/auth/next/server";

// Neon Auth on the server: the /api/auth proxy, route protection and session reads.
// Null when the env isn't set (a fresh clone, CI), so pages render signed out instead of crashing.
const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

export const auth = baseUrl && secret ? createNeonAuth({ baseUrl, cookies: { secret } }) : null;
