"use client";

import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type StreamHandlers = {
  onToken: (text: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
};

/**
 * Opens a POST SSE stream to the chat endpoint and parses event frames.
 * Returns an abort function so the UI can cancel mid-stream.
 */
export async function streamChat(
  message: string,
  handlers: StreamHandlers,
): Promise<() => void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const controller = new AbortController();

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ message }),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) {
    handlers.onError?.(`Stream failed (${res.status})`);
    return () => controller.abort();
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are delimited by a blank line
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          let event = "message";
          let data = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("event: ")) event = line.slice(7);
            else if (line.startsWith("data: ")) data += line.slice(6);
          }
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (event === "token") handlers.onToken(parsed.text ?? "");
            else if (event === "done") handlers.onDone?.();
            else if (event === "error")
              handlers.onError?.(parsed.message ?? "Stream error");
          } catch {
            // ignore malformed frames
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        handlers.onError?.((e as Error).message);
      }
    }
  })();

  return () => controller.abort();
}
