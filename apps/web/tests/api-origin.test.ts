import { describe, expect, it } from "vitest";

import { apiOrigin } from "@/lib/api-origin";

describe("apiOrigin", () => {
  it("uses API_ORIGIN when it's set", () => {
    expect(apiOrigin({ API_ORIGIN: "https://api.example", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feat/x" })).toBe("https://api.example");
  });

  it("pairs a web preview with the API preview from the same branch", () => {
    expect(apiOrigin({ VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feat/Neon_Auth" })).toBe(
      "https://finsight-api-git-feat-neon-auth-elisabeth-nnamanis-projects.vercel.app",
    );
  });

  it("falls back to production for branch names Vercel would shorten", () => {
    const env = { VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feat/a-very-long-branch-name", API_PRODUCTION_ORIGIN: "https://prod.example" };
    expect(apiOrigin(env)).toBe("https://prod.example");
  });

  it("defaults to the local API", () => {
    expect(apiOrigin({})).toBe("http://localhost:8000");
  });
});
