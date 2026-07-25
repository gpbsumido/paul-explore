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
  prompt?: string;
  tool?: ToolCall;
  plan?: string[];
  citations?: string[];
};

type Answer = {
  tool: { name: string; args: string };
  reply: string;
  citations: string[];
};

/** The steps the "agent" walks through, shown as a plan in agent mode. */
const PLAN = ["Read the question", "Query the warehouse", "Summarize the finding"];

/** Canned answers keyed by a keyword, each with its tool call and sources. */
const ANSWERS: { match: RegExp; tool: Answer["tool"]; reply: string; citations: string[] }[] = [
  {
    match: /retention|churn/i,
    tool: { name: "query_warehouse", args: "metric: retention, window: 30d" },
    reply:
      "D1 retention is holding at 42% but D30 slipped 3 points this week. The drop concentrates in players who never finished the tutorial, so that is where I would look first.",
    citations: ["retention_daily", "tutorial_funnel"],
  },
  {
    match: /revenue|arpu|money/i,
    tool: { name: "query_warehouse", args: "metric: revenue, window: 7d" },
    reply:
      "Revenue is up 8% week over week, driven mostly by the battle pass rather than one-off purchases. ARPU is flat, so the lift is coming from more payers, not bigger spenders.",
    citations: ["revenue_daily", "iap_breakdown"],
  },
  {
    match: /whale|top spender/i,
    tool: { name: "segment_players", args: "cohort: top_spenders" },
    reply:
      "Your top 2% of accounts drive 38% of revenue. That is healthy for this genre, but worth watching, a single churned whale is a visible dip.",
    citations: ["spender_cohorts"],
  },
];

const DEFAULT = {
  tool: { name: "search_docs", args: "q: metrics" },
  reply:
    "I can pull that from the analytics warehouse. In the demo I only have a few canned answers, try asking about retention, revenue, or whales.",
  citations: ["demo_readme"],
};

const SUGGESTIONS = ["How is retention?", "What about revenue?", "Who are the whales?"];

function answerFor(prompt: string): Answer {
  const match = ANSWERS.find((a) => a.match.test(prompt)) ?? DEFAULT;
  return { tool: match.tool, reply: match.reply, citations: match.citations };
}

type Timer = { id: ReturnType<typeof setTimeout>; kind: "timeout" | "interval" };

/**
 * Flagship demo for portal v2's LLM assistant. A chat surface that mocks the
 * agent-UI patterns end to end: an agent/chat mode toggle, a plan of steps, a
 * tool-call row that runs then completes, tokens that stream in, citation
 * chips, and stop/retry controls. Everything is canned, there is no model.
 */
export default function LlmAssistantDemo({ feature }: { feature: WorkFeature }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"agent" | "chat">("agent");
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<Timer[]>([]);

  const clearTimers = () => {
    for (const t of timers.current) {
      if (t.kind === "interval") clearInterval(t.id);
      else clearTimeout(t.id);
    }
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages]);

  /** Run the tool-then-stream sequence for one assistant message. */
  const run = (replyId: number, answer: Answer) => {
    setStreaming(true);
    setMessages((m) =>
      m.map((msg) =>
        msg.id === replyId
          ? { ...msg, text: "", citations: undefined, tool: { ...answer.tool, status: "running" } }
          : msg,
      ),
    );

    const words = answer.reply.split(" ");
    const toolTimer = setTimeout(() => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === replyId && msg.tool
            ? { ...msg, tool: { ...msg.tool, status: "done" } }
            : msg,
        ),
      );
      let i = 0;
      const streamTimer = setInterval(() => {
        i += 1;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === replyId ? { ...msg, text: words.slice(0, i).join(" ") } : msg,
          ),
        );
        if (i >= words.length) {
          clearInterval(streamTimer);
          setMessages((m) =>
            m.map((msg) =>
              msg.id === replyId ? { ...msg, citations: answer.citations } : msg,
            ),
          );
          setStreaming(false);
        }
      }, 45);
      timers.current.push({ id: streamTimer, kind: "interval" });
    }, 500);
    timers.current.push({ id: toolTimer, kind: "timeout" });
  };

  const send = (text: string) => {
    const prompt = text.trim();
    if (!prompt || streaming) return;
    const answer = answerFor(prompt);
    const userMsg: Msg = { id: nextId.current++, role: "user", text: prompt };
    const replyId = nextId.current++;
    setMessages((m) => [
      ...m,
      userMsg,
      {
        id: replyId,
        role: "assistant",
        text: "",
        prompt,
        tool: { ...answer.tool, status: "running" },
        plan: mode === "agent" ? PLAN : undefined,
      },
    ]);
    setInput("");
    run(replyId, answer);
  };

  const stop = () => {
    clearTimers();
    setStreaming(false);
  };

  const retry = (msg: Msg) => {
    if (streaming || !msg.prompt) return;
    run(msg.id, answerFor(msg.prompt));
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex h-full min-h-64 flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>
        <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
          {(["agent", "chat"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className="px-2 py-0.5"
              style={mode === m ? { backgroundColor: ACCENT, color: "#fff" } : undefined}
            >
              {m === "agent" ? "Agent" : "Chat"}
            </button>
          ))}
        </div>
      </div>

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
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex max-w-[85%] flex-col gap-1">
              {mode === "agent" && m.plan && (
                <ol data-testid="agent-plan" className="rounded-md border border-border bg-background/60 p-1.5 text-[10px]">
                  {m.plan.map((step, i) => {
                    const progress = m.text ? m.plan!.length : m.tool?.status === "done" ? m.plan!.length - 1 : 1;
                    const done = i < progress;
                    return (
                      <li key={step} className="flex items-center gap-1.5">
                        <span aria-hidden className={done ? "text-emerald-500" : "text-muted"}>
                          {done ? "✓" : "•"}
                        </span>
                        <span className={done ? "text-foreground" : "text-muted"}>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {m.tool && (
                <div
                  data-testid="tool-call"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] text-muted"
                >
                  <span aria-hidden className={m.tool.status === "running" ? "animate-pulse" : "text-emerald-500"}>
                    {m.tool.status === "running" ? "◷" : "✓"}
                  </span>
                  <span className="text-foreground">{m.tool.name}</span>
                  <span className="truncate">({m.tool.args})</span>
                </div>
              )}
              {m.text !== "" && (
                <div
                  data-testid={m.role === "assistant" ? "assistant-text" : undefined}
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
              {m.citations && (
                <div className="flex flex-wrap items-center gap-1">
                  {m.citations.map((c, i) => (
                    <span
                      key={c}
                      title={c}
                      className="rounded border border-border px-1 font-mono text-[9px] text-muted"
                    >
                      [{i + 1}] {c}
                    </span>
                  ))}
                </div>
              )}
              {m.role === "assistant" && m.id === lastAssistantId && m.text !== "" && !streaming && (
                <button
                  type="button"
                  onClick={() => retry(m)}
                  className="self-start text-[10px] text-muted underline hover:text-foreground"
                >
                  Retry
                </button>
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
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-foreground"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
