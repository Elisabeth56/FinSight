import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";

const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url });

describe("proxy matcher", () => {
  it("leaves marketing pages alone so they render without auth config", () => {
    expect(matches("/")).toBe(false);
    expect(matches("/demo")).toBe(false);
  });

  it("runs on app and auth routes", () => {
    expect(matches("/dashboard")).toBe(true);
    expect(matches("/dashboard/chat")).toBe(true);
    expect(matches("/login")).toBe(true);
    expect(matches("/signup")).toBe(true);
  });
});

describe("proxy without auth configured", () => {
  it("sends app routes to sign in instead of failing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const res = await proxy(new NextRequest("http://localhost:3000/dashboard/chat"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fdashboard%2Fchat");
    vi.unstubAllEnvs();
  });
});
