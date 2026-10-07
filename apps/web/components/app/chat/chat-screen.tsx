"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { type Answer, useChat } from "@/components/app/chat/use-chat";
import { Button } from "@/components/ui/button";
import { sourcesHref } from "@/lib/chat-stream";
import { dayRange } from "@/lib/dates";
import { describeError } from "@/lib/errors";
import { splitFigures } from "@/lib/figures";
import { useStoredState } from "@/lib/use-stored-state";

const STARTERS = [
  "Where did most of my money go last month?",
  "How much did I spend on Bolt in the last 3 months?",
  "What subscriptions do I pay for?",
  "Compare February and March",
];

export function ChatScreen() {
  const { answers, ask, retry, stop, busy } = useChat();
  const end = useRef<HTMLDivElement>(null);
  const last = answers.at(-1);

  // keep the newest words in view while they stream
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [last?.text, answers.length]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-[820px] flex-col gap-6 lg:min-h-[calc(100dvh-80px)]">
      <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">Ask about your money</h1>
      <div className="flex flex-1 flex-col gap-5">
        {answers.length === 0 && <Intro />}
        {answers.map((a) => (
          <Exchange key={a.id} answer={a} onStop={stop} onRetry={() => retry(a.id)} />
        ))}
        <div ref={end} />
      </div>
      <Composer busy={busy} onAsk={ask} suggestions={answers.length ? STARTERS.slice(2) : STARTERS} />
    </div>
  );
}

function Intro() {
  return (
    <p className="max-w-[560px] text-[15px] leading-relaxed text-ink-2">
      Ask in plain words. FinSight adds the numbers up in the database and only then explains them, so every
      figure matches your statement. Tap a source under an answer to see the rows behind it.
    </p>
  );
}

function Exchange({ answer, onStop, onRetry }: { answer: Answer; onStop: () => void; onRetry: () => void }) {
  return (
    <>
      <div className="max-w-[80%] self-end rounded-[20px] bg-sunk px-[18px] py-3 text-[15px] leading-normal">{answer.question}</div>
      {answer.status === "failed" ? (
        <FailedAnswer answer={answer} onRetry={onRetry} />
      ) : (
        <AnswerCard answer={answer} onStop={onStop} />
      )}
    </>
  );
}

function AnswerCard({ answer, onStop }: { answer: Answer; onStop: () => void }) {
  const live = answer.status === "waiting" || answer.status === "streaming";
  return (
    <div aria-live="polite" aria-busy={live} className="flex flex-col gap-3 rounded-[20px] bg-surface px-[22px] py-5">
      {answer.status === "waiting" && <span className="text-xs text-ink-3">Looking through your transactions</span>}
      {answer.text && (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {splitFigures(answer.text).map((part, i) =>
            part.isFigure ? <strong key={i} className="font-semibold text-brand">{part.text}</strong> : part.text,
          )}
          {live && <span aria-hidden className="ml-0.5 inline-block h-4 w-2 animate-caret rounded-sm bg-brand align-[-3px]" />}
        </p>
      )}
      {answer.status === "stopped" && <span className="text-xs text-ink-3">Stopped. Ask again to get the full answer.</span>}
      {answer.sources && <SourceChips answer={answer} />}
      {live && (
        <button type="button" onClick={onStop} className="h-8 self-start rounded-full border border-line px-3 text-xs text-ink-2 hover:text-ink">
          Stop
        </button>
      )}
    </div>
  );
}

function SourceChips({ answer }: { answer: Answer }) {
  const s = answer.sources!;
  if (s.count === 0) return null;
  const chips = [`From ${s.count} ${s.count === 1 ? "transaction" : "transactions"}`];
  if (s.start && s.end) chips.push(dayRange(s.start, s.end));
  if (s.categories.length) chips.push(s.categories.join(", "));
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link key={chip} href={sourcesHref(s)} className="inline-flex h-8 items-center rounded-full bg-sunk px-3 text-xs text-ink-2 hover:text-ink">
          {chip}
        </Link>
      ))}
    </div>
  );
}

function FailedAnswer({ answer, onRetry }: { answer: Answer; onRetry: () => void }) {
  const view = answer.error ? describeError(answer.error) : { title: "Chat stopped", message: "Something went wrong. Ask again." };
  return (
    <div role="status" className="flex flex-col items-start gap-2.5 rounded-[20px] bg-surface px-[22px] py-5">
      <span className="text-[15px] font-medium">{view.title}</span>
      <span className="text-sm leading-relaxed text-ink-2">{view.message} Your question is kept.</span>
      <Button variant="quiet" onClick={onRetry} className="mt-1">Try again</Button>
    </div>
  );
}

function Composer({ busy, onAsk, suggestions }: { busy: boolean; onAsk: (q: string) => void; suggestions: string[] }) {
  const [stored, setDraft] = useStoredState("finsight:chat-draft");
  const draft = stored ?? "";

  function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    onAsk(q);
    setDraft(null);
  }

  return (
    <div className="sticky bottom-24 flex flex-col gap-3 bg-paper pt-2 pb-1 lg:bottom-4">
      <div className="flex gap-2 overflow-x-auto">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => send(s)} className="h-9 shrink-0 rounded-full border border-line px-3.5 text-[13px] text-ink-2 hover:text-ink disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex h-14 items-center gap-3 rounded-full bg-surface pr-2 pl-5 shadow-card focus-within:outline-2 focus-within:outline-brand"
      >
        <label htmlFor="ask" className="sr-only">Ask about your spending</label>
        <input id="ask" value={draft} maxLength={500} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your spending" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3" />
        <button type="submit" aria-label="Send" disabled={busy || !draft.trim()} className={clsx("inline-flex size-10 items-center justify-center rounded-full bg-action transition-opacity", (busy || !draft.trim()) && "opacity-50")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-action)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
