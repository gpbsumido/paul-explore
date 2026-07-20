"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import type { WorkFeature } from "../_data/types";

const ACCENT = "var(--wp-accent, #60a5fa)";

type ToolCall = { name: string; args: string; status: "running" | "done" };
type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  tool?: ToolCall;
};

/** Canned answers keyed by a keyword, each with the tool call it "ran". */
const ANSWERS: { match: RegExp; tool: { name: string; args: string }; reply: string }[] = [
  {
    match: /retention|churn/i,
    tool: { name: "query_warehouse", args: "metric: retention, window: 30d" },
    reply:
      "D1 retention is holding at 42% but D30 slipped 3 points this week. The drop concentrates in players who never finished the tutorial, so that is where I would look first.",
  },
  {
    match: /revenue|arpu|money/i,
    tool: { name: "query_warehouse", args: "metric: revenue, window: 7d" },
    reply:
      "Revenue is up 8% week over week, driven mostly by the battle pass rather than one-off purchases. ARPU is flat, so the lift is coming from more payers, not bigger spenders.",
  },
  {
    match: /whale|top spender/i,
    tool: { name: "segment_players", args: "cohort: top_spenders" },
    reply:
      "Your top 2% of accounts drive 38% of revenue. That is healthy for this genre, but worth watching, a single churned whale is a visible dip.",
  },
];

const DEFAULT = {
  tool: { name: "search_docs", args: "q: metrics" },
  reply:
    "I can pull that from the analytics warehouse. In the demo I only have a few canned answers, try asking about retention, revenue, or whales.",
};

const SUGGESTIONS = ["How is retention?", "What about revenue?", "Who are the whales?"];

function answerFor(prompt: string) {
  return ANSWERS.find((a) => a.match.test(prompt)) ?? DEFAULT;
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
    const { tool, reply } = answerFor(prompt);
    const userMsg: Msg = { id: nextId.current++, role: "user", text: prompt };
    const replyId = nextId.current++;
    setMessages((m) => [
      ...m,
      userMsg,
      {
        id: replyId,
        role: "assistant",
        text: "",
        tool: { ...tool, status: "running" },
      },
    ]);
    setInput("");
    setStreaming(true);

    // First the tool "runs", then the answer streams word by word.
    const words = reply.split(" ");
    const toolTimer = setTimeout(() => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === replyId && msg.tool
            ? { ...msg, tool: { ...msg.tool, status: "done" } }
            : msg,
        ),
      );
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
    }, 500);
    void toolTimer;
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
            <div className="flex max-w-[85%] flex-col gap-1">
              {m.tool && (
                <div
                  data-testid="tool-call"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] text-muted"
                >
                  <span
                    aria-hidden
                    className={
                      m.tool.status === "running"
                        ? "animate-pulse"
                        : "text-emerald-500"
                    }
                  >
                    {m.tool.status === "running" ? "◷" : "✓"}
                  </span>
                  <span className="text-foreground">{m.tool.name}</span>
                  <span className="truncate">({m.tool.args})</span>
                </div>
              )}
              {m.text !== "" && (
                <div
                  className={`rounded-2xl px-3 py-1.5 text-[12px] ${
                    m.role === "user"
                      ? "self-end text-white"
                      : "border border-border bg-background text-foreground"
                  }`}
                  style={m.role === "user" ? { backgroundColor: ACCENT } : undefined}
                >
                  {m.text}
                </div>
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
        <Input
          label="Message"
          hideLabel
          size="sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask a question"
          className="min-w-0 flex-1"
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
