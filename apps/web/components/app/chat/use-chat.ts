"use client";

import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { type ChatSources, streamChat } from "@/lib/chat-stream";

export type Answer = {
  id: number;
  question: string;
  text: string;
  sources?: ChatSources;
  status: "waiting" | "streaming" | "done" | "stopped" | "failed";
  error?: ApiError;
};

/** The conversation as question-and-answer pairs, with stop and retry. */
export function useChat() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  const patch = (id: number, change: Partial<Answer> | ((a: Answer) => Partial<Answer>)) =>
    setAnswers((list) => list.map((a) => (a.id === id ? { ...a, ...(typeof change === "function" ? change(a) : change) } : a)));

  const run = useCallback(async (id: number, question: string) => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    try {
      await streamChat(
        question,
        {
          onToken: (text) => patch(id, (a) => ({ text: a.text + text, status: "streaming" })),
          onSources: (sources) => patch(id, { sources }),
        },
        abort.signal,
      );
      patch(id, { status: "done" });
    } catch (error) {
      if (abort.signal.aborted) return patch(id, { status: "stopped" });
      patch(id, { status: "failed", error: error instanceof ApiError ? error : undefined });
    }
  }, []);

  const ask = useCallback(
    (question: string) => {
      const id = nextId.current++;
      setAnswers((list) => [...list, { id, question, text: "", status: "waiting" }]);
      void run(id, question);
    },
    [run],
  );

  const retry = useCallback(
    (id: number) => {
      const answer = answers.find((a) => a.id === id);
      if (!answer) return;
      patch(id, { text: "", sources: undefined, error: undefined, status: "waiting" });
      void run(id, answer.question);
    },
    [answers, run],
  );

  const stop = useCallback(() => controller.current?.abort(), []);
  const busy = answers.some((a) => a.status === "waiting" || a.status === "streaming");
  return { answers, ask, retry, stop, busy };
}
