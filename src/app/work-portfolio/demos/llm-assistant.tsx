"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #60a5fa)";

type Msg = { id: number; role: "user" | "assistant"; text: string };

/** Canned answers keyed by a keyword in the prompt, with a default. */
const ANSWERS: { match: RegExp; reply: string }[] = [
  {
    match: /retention|churn/i,
    reply:
      "D1 retention is holding at 42% but D30 slipped 3 points this week. The drop concentrates in players who never finished the tutorial, so that is where I would look first.",
  },
  {
    match: /revenue|arpu|money/i,
    reply:
      "Revenue is up 8% week over week, driven mostly by the battle pass rather than one-off purchases. ARPU is flat, so the lift is coming from more payers, not bigger spenders.",
  },
  {
    match: /whale|top spender/i,
    reply:
      "Your top 2% of accounts drive 38% of revenue. That is healthy for this genre, but worth watching, a single churned whale is a visible dip.",
  },
];

const DEFAULT_REPLY =
  "I can pull that from the analytics warehouse. In the demo I only have a few canned answers, try asking about retention, revenue, or whales.";

const SUGGESTIONS = ["How is retention?", "What about revenue?", "Who are the whales?"];

function answerFor(prompt: string): string {
  return ANSWERS.find((a) => a.match.test(prompt))?.reply ?? DEFAULT_REPLY;
}

/**
 * Flagship demo for portal v2's LLM assistant. A chat surface that streams
 * canned answers word by word. Tool-call rows come in the next commit.
 */
export default function LlmAssistantDemo({ feature }: { feature: WorkFeature }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // jsdom has no scrollTo, so keep this best-effort
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages]);

  const send = (text: string) => {
    const prompt = text.trim();
    if (!prompt || streaming) return;
    const userMsg: Msg = { id: nextId.current++, role: "user", text: prompt };
    const replyId = nextId.current++;
    setMessages((m) => [...m, userMsg, { id: replyId, role: "assistant", text: "" }]);
    setInput("");
    setStreaming(true);

    const words = answerFor(prompt).split(" ");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setMessages((m) =>
        m.map((msg) =>
          msg.id === replyId ? { ...msg, text: words.slice(0, i).join(" ") } : msg,
        ),
      );
      if (i >= words.length) {
        clearInterval(timer);
        setStreaming(false);
      }
    }, 45);
  };

  return (
    <div className="flex h-full min-h-64 flex-col gap-2 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-border bg-background/40 p-3"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-[12px] text-muted">
            ask about your game&apos;s metrics
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[12px] ${
                m.role === "user"
                  ? "text-white"
                  : "border border-border bg-background text-foreground"
              }`}
              style={m.role === "user" ? { backgroundColor: ACCENT } : undefined}
            >
              {m.text}
              {m.role === "assistant" && m.text === "" && streaming && (
                <span className="text-muted">…</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            disabled={streaming}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask a question"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground"
        />
        <button
          type="submit"
          disabled={streaming}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
