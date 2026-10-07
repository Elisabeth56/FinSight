import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

/** "Try the demo": signs straight into the seeded demo account and opens the dashboard. */
export async function GET(request: NextRequest) {
  // the router prefetches links in view; only a real visit should sign anyone in
  if (isPrefetch(request)) return new Response(null, { status: 204 });

  const failed = NextResponse.redirect(new URL("/login?error=demo_unavailable", request.url));
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!auth || !email || !password) return failed;

  // sign in through our own /api/auth proxy as our own origin: visitors arriving from a link
  // elsewhere (GitHub, a CV) carry a referrer that Neon Auth's trusted-origin check refuses
  const origin = request.nextUrl.origin;
  const signIn = await auth.handler().POST(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password }),
    }),
    { params: Promise.resolve({ path: ["sign-in", "email"] }) },
  );
  if (!signIn.ok) return failed;

  const res = NextResponse.redirect(new URL("/dashboard", request.url));
  for (const cookie of signIn.headers.getSetCookie()) res.headers.append("set-cookie", cookie);
  return res;
}

function isPrefetch(request: Request): boolean {
  const h = request.headers;
  return h.has("next-router-prefetch") || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.startsWith("prefetch") === true;
}
