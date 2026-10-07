import { auth } from "@/lib/auth/server";

// Neon Auth's endpoints, proxied on our origin so session cookies are first-party.
// The /api/* rewrite to FastAPI is a fallback in next.config.js, so this route wins.
const handler = auth?.handler();

function notConfigured() {
  return Response.json(
    { error: { code: "auth_not_configured", message: "Sign-in isn't set up here yet.", details: {} } },
    { status: 503 },
  );
}

export const GET = handler?.GET ?? notConfigured;
export const POST = handler?.POST ?? notConfigured;
