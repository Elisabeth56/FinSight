"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, Square } from "lucide-react";

import { streamChat } from "@/lib/stream";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const SUGGESTIONS = [
  "Where did most of my money go last month?",
  "How much did I spend on dining in March?",
  "Show me any unusual transactions.",
  "What's my biggest recurring expense?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        streaming: true,
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);
      setInput("");
      setStreaming(true);

      const assistantId = assistantMsg.id;

      const abort = await streamChat(text, {
        onToken: (t) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + t } : m,
            ),
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            ),
          );
          setStreaming(false);
          abortRef.current = null;
        },
        onError: (msg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `⚠ ${msg}`,
                    streaming: false,
                  }
                : m,
            ),
          );
          setStreaming(false);
          abortRef.current = null;
        },
      });
      abortRef.current = abort;
    },
    [streaming],
  );

  function stop() {
    abortRef.current?.();
    abortRef.current = null;
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-400" />
          Chat with your finances
        </h1>
        <p className="text-sm text-gray-400">
          Ask anything — powered by LLaMA 3 via Groq. Responses stream in real time.
        </p>
      </div>

      {/* messages */}
      <div className="flex-1 rounded-2xl bg-dark-800 border border-white/5 p-5 mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyChat onPick={send} />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* input */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full bg-dark-800 border border-white/10 px-2 py-1.5 focus-within:border-green-500/40 transition-colors"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
          disabled={streaming}
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
            aria-label="Stop"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center text-dark-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}

/* ---------- message bubble ---------- */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-green-600 text-white rounded-2xl rounded-br-md"
            : "bg-dark-700 text-white rounded-2xl rounded-bl-md"
        }`}
      >
        {msg.content}
        {msg.streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-green-400 animate-pulse" />
        )}
      </div>
    </motion.div>
  );
}

/* ---------- empty state ---------- */
function EmptyChat({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10">
      <div className="w-14 h-14 mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-dark-900" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">
        Ask anything about your money
      </h3>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        I have access to your parsed transactions. Try one of these:
      </p>
      <div className="grid sm:grid-cols-2 gap-2 w-full max-w-xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left px-4 py-3 rounded-xl bg-dark-700/50 border border-white/5 text-sm text-gray-300 hover:bg-white/5 hover:border-green-500/20 hover:text-white transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
