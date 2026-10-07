import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "@/proxy";

const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url });

describe("proxy matcher", () => {
  it("leaves marketing, auth and demo routes alone so they render without auth config", () => {
    expect(matches("/")).toBe(false);
    expect(matches("/demo")).toBe(false);
    expect(matches("/login")).toBe(false);
    expect(matches("/api/auth/get-session")).toBe(false);
  });

  it("runs on every app route", () => {
    expect(matches("/dashboard")).toBe(true);
    expect(matches("/dashboard/chat")).toBe(true);
  });
});

describe("proxy without auth configured", () => {
  it("sends app routes to sign in, remembering where they were headed", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/dashboard/chat"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fdashboard%2Fchat");
  });
});
