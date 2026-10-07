import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

// Neon Auth's middleware checks the session, refreshes its cookies and finishes the Google
// sign-in (it swaps the verifier in the callback URL for a session cookie)
const protect = auth?.middleware({ loginUrl: "/login" });

export async function proxy(request: NextRequest) {
  const res = protect ? await protect(request) : NextResponse.redirect(new URL("/login", request.url));

  // remember where they were headed, so sign-in can bring them back
  const location = res.headers.get("location");
  if (location && new URL(location).pathname === "/login") {
    const url = new URL(location);
    url.searchParams.set("next", request.nextUrl.pathname);
    res.headers.set("location", url.toString());
  }
  return res;
}

// only the app needs a session; marketing and auth pages stay static and auth-free
export const config = {
  matcher: ["/dashboard/:path*"],
};
