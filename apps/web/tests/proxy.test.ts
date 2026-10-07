import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

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
