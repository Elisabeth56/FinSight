"use client";

// POST /chat as Server-Sent Events: `token` while the answer streams, then `sources` and `done`,
// or `error`. Failures before the stream opens (auth, rate limit) arrive as plain JSON errors.
import { API_URL, ApiError, authHeader, parseApiError } from "@/lib/api";

export type ChatSources = { count: number; start: string | null; end: string | null; categories: string[] };

type Handlers = { onToken: (text: string) => void; onSources: (sources: ChatSources) => void };

type Frame = { event: string; data: string };

/** Splits complete SSE frames off the buffer; whatever is left is an unfinished frame. */
export function parseFrames(buffer: string): { frames: Frame[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const frames = parts.map((part) => {
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7);
      else if (line.startsWith("data: ")) data += line.slice(6);
    }
    return { event, data };
  });
  return { frames, rest };
}

/** Streams one answer. Resolves when done; rejects with ApiError. Abort with `signal`. */
export async function streamChat(message: string, handlers: Handlers, signal: AbortSignal): Promise<void> {
  const headers = { ...(await authHeader()), "Content-Type": "application/json", Accept: "text/event-stream" };
  const res = await fetch(`${API_URL}/chat`, { method: "POST", headers, body: JSON.stringify({ message }), signal }).catch((e) => {
    throw e.name === "AbortError" ? e : new ApiError(0, "offline", "We couldn't reach FinSight. Check your connection and try again.");
  });
  if (!res.ok || !res.body) throw parseApiError(res.status, await res.text().catch(() => ""));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    const parsed = parseFrames(buffer + decoder.decode(value, { stream: true }));
    buffer = parsed.rest;
    for (const frame of parsed.frames) handleFrame(frame, handlers);
  }
}

function handleFrame({ event, data }: Frame, handlers: Handlers) {
  if (!data) return;
  const payload = JSON.parse(data);
  if (event === "token") handlers.onToken(payload.text ?? "");
  else if (event === "sources") handlers.onSources(payload);
  else if (event === "error") throw new ApiError(200, payload.code ?? "internal_error", payload.message ?? "Chat stopped unexpectedly. Ask again.");
}

/** Where a source chip leads: the transactions page narrowed to the answer's month and category. */
export function sourcesHref(sources: ChatSources): string {
  const query = new URLSearchParams();
  if (sources.start && sources.end && sources.start.slice(0, 7) === sources.end.slice(0, 7)) {
    query.set("month", sources.start.slice(0, 7));
  }
  if (sources.categories.length === 1) query.set("category", sources.categories[0]);
  return `/dashboard/transactions${query.size ? `?${query}` : ""}`;
}
