import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";
import { describeError } from "@/lib/errors";

describe("describeError", () => {
  it("keeps the API's message and picks the helpful action", () => {
    const view = describeError(new ApiError(402, "upload_quota_reached", "You've used this month's free upload."));
    expect(view).toEqual({
      title: "You've used this month's free upload",
      action: "upgrade",
      message: "You've used this month's free upload.",
    });
  });

  it("sends expired sessions to sign in", () => {
    expect(describeError(new ApiError(401, "session_expired", "Sign in again.")).action).toBe("sign-in");
  });

  it("gives unknown codes a calm retry", () => {
    expect(describeError(new ApiError(500, "internal_error", "Try again.")).action).toBe("retry");
  });
});
