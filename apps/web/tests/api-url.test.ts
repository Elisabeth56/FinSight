import { afterEach, describe, expect, it, vi } from "vitest";

describe("API_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("stays on this origin even when an old NEXT_PUBLIC_API_URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://finsightai.up.railway.app");
    const { API_URL } = await import("@/lib/api");
    expect(API_URL).toBe("/api");
  });
});
