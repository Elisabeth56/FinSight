import { describe, expect, it } from "vitest";

import { parseFrames, sourcesHref } from "@/lib/chat-stream";

describe("parseFrames", () => {
  it("reads complete frames and keeps the unfinished tail", () => {
    const { frames, rest } = parseFrames('event: token\ndata: {"text":"Food"}\n\nevent: token\ndata: {"te');
    expect(frames).toEqual([{ event: "token", data: '{"text":"Food"}' }]);
    expect(rest).toBe('event: token\ndata: {"te');
  });

  it("joins a frame split across two reads", () => {
    const first = parseFrames('event: sources\ndata: {"count":');
    const second = parseFrames(first.rest + '14}\n\nevent: done\ndata: {}\n\n');
    expect(second.frames).toEqual([
      { event: "sources", data: '{"count":14}' },
      { event: "done", data: "{}" },
    ]);
    expect(second.rest).toBe("");
  });
});

describe("sourcesHref", () => {
  it("narrows to one month and one category when the answer covers just those", () => {
    expect(sourcesHref({ count: 14, start: "2026-03-01", end: "2026-03-31", categories: ["Transport"] })).toBe(
      "/dashboard/transactions?month=2026-03&category=Transport",
    );
  });

  it("opens everything when the answer spans months and categories", () => {
    expect(sourcesHref({ count: 40, start: "2026-01-02", end: "2026-03-30", categories: ["Food & Dining", "Transport"] })).toBe(
      "/dashboard/transactions",
    );
  });
});
