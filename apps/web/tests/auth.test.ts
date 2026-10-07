import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as demo } from "@/app/demo/route";
import { GET as authProxy } from "@/app/api/auth/[...path]/route";
import { authFailure, authMessage } from "@/lib/auth/messages";
import { safeNext } from "@/lib/auth/redirect";
import { tokenExpiry } from "@/lib/auth/token";

describe("try the demo", () => {
  it("ignores router prefetches, so links in view never sign anyone in", async () => {
    const req = new NextRequest("http://localhost:3000/demo", { headers: { "next-router-prefetch": "1" } });
    expect((await demo(req)).status).toBe(204);
  });

  it("explains on the sign-in page when the demo isn't configured", async () => {
    const res = await demo(new NextRequest("http://localhost:3000/demo"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=demo_unavailable");
  });
});

describe("auth proxy without config", () => {
  it("answers in the shared error shape instead of crashing", async () => {
    const res = await authProxy(new Request("http://localhost:3000/api/auth/get-session"), {
      params: Promise.resolve({ path: ["get-session"] }),
    });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("auth_not_configured");
  });
});

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/dashboard/chat")).toBe("/dashboard/chat");
  });

  it("refuses other sites and falls back to the dashboard", () => {
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
});

describe("tokenExpiry", () => {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  it("reads exp from a JWT", () => {
    expect(tokenExpiry(`${encode({ alg: "EdDSA" })}.${encode({ exp: 1791407613 })}.sig`)).toBe(1791407613);
  });

  it("treats an unreadable token as already expired", () => {
    expect(tokenExpiry("not-a-jwt")).toBe(0);
  });
});

describe("auth messages", () => {
  it("turns known codes into plain copy and unknown ones into a calm fallback", () => {
    expect(authMessage("invalid_credentials")).toMatch(/don't match/);
    expect(authMessage("something_new")).toMatch(/couldn't sign you in/);
    expect(authMessage(null)).toBeNull();
  });

  it("reads errors the SDK throws as well as ones it returns", async () => {
    const thrown = Object.assign(new Error("Invalid email or password"), { code: "invalid_credentials" });
    expect(await authFailure(() => Promise.reject(thrown))).toMatch(/don't match/);
    expect(await authFailure(async () => ({ error: { code: "email_exists" } }))).toMatch(/Sign in instead/);
    expect(await authFailure(async () => ({ data: {}, error: null }))).toBeNull();
  });
});
