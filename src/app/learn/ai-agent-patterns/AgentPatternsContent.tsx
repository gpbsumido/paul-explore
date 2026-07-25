"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import { SCENARIOS } from "@/lib/agent/mock-stream";
import { useAgentRun } from "@/hooks/useAgentRun";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { AgentTimeline } from "@/components/agent/AgentTimeline";
import { StopButton } from "@/components/agent/StopButton";
import type { Scenario } from "@/lib/agent/types";

const BREADCRUMBS = [
  { label: "Hub", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "AI Agent Patterns" },
];

const SECTIONS = [
  {
    title: "SSE Parsing",
    body: `Server-Sent Events use a simple text-based wire format: each event is a block of field lines (event:, data:, id:) separated by a blank line. The parser maintains an internal buffer to handle chunks that split mid-event across network boundaries. This is cheaper than WebSockets when you only need server-to-client streaming, and it works over standard HTTP with automatic reconnection built into the browser EventSource API.`,
    code: `event: text_delta
data: {"content":"Hello"}

event: done
data: {}`,
  },
  {
    title: "State Machine",
    body: `The agent run state is modeled as a discriminated union on status: idle, running, awaiting_approval, completed, error, or cancelled. Each variant carries only the data relevant to that state, so impossible states are unrepresentable. A pure reducer handles all transitions, making every state change testable without React. This replaces the brittle pattern of multiple boolean flags (isLoading, isError, isWaiting) that can drift out of sync.`,
    code: `type AgentRunState =
  | { status: "idle" }
  | { status: "running"; steps: AgentStep[] }
  | { status: "awaiting_approval"; steps: AgentStep[]; pendingAction: ... }
  | { status: "completed"; steps: AgentStep[] }
  | { status: "error"; steps: AgentStep[]; error: string }
  | { status: "cancelled"; steps: AgentStep[] }`,
  },
  {
    title: "Streaming Text",
    body: `Each text_delta token from the stream is tiny, often just a word or punctuation. Calling setState on every token would trigger a React render per token, which tanks performance. Instead, tokens accumulate in a ref buffer and flush to state via requestAnimationFrame, batching many tokens into a single render. This keeps the UI at 60fps even during fast streaming.`,
  },
  {
    title: "Tool Calls",
    body: `Agent tool calls follow a start/result lifecycle: tool_use_start arrives with the tool name and input, then tool_result arrives later with the output. The timeline renders each tool call as an expandable card showing the function name, a status indicator (spinner while running, checkmark when done, X on error), and collapsible input/output JSON. This makes the agent's reasoning transparent and debuggable.`,
  },
  {
    title: "Approval Gates",
    body: `Some actions are too dangerous for autonomous execution. The approval gate pattern pauses the stream when the agent requests human approval, renders the proposed action with Approve/Deny buttons, and only resumes streaming after explicit human confirmation. The stream itself pauses (the ReadableStream stops yielding chunks) rather than buffering events, so there's no race condition between approval and execution.`,
  },
  {
    title: "Auto-scroll",
    body: `The timeline container auto-scrolls to keep new content visible, but only when the user is already near the bottom (within 100px). If the user has scrolled up to review earlier content, auto-scroll pauses so their position isn't disrupted. A passive scroll listener avoids blocking the main thread. This is the same pattern used by every chat interface, but getting the threshold right matters for UX.`,
  },
  {
    title: "Error Handling",
    body: `Stream errors don't always mean total failure. The error_recovery scenario demonstrates a stream that interrupts mid-response, emits an error event, then resumes with recovery text. The state machine transitions to error status and preserves all partial steps, so the user never loses content they've already seen. The UI renders a red error banner inline in the timeline rather than replacing everything with an error page.`,
  },
  {
    title: "Anti-patterns",
    body: `Common mistakes in agent UIs: polling an API instead of using streaming (wastes bandwidth, adds latency). Using dangerouslySetInnerHTML for markdown (XSS risk). No cancel button (user is trapped waiting). Replacing the entire UI on error instead of preserving partial content. Using multiple boolean flags instead of a state machine (leads to impossible states like isLoading && isError). Re-rendering on every token instead of batching (jank at 200+ tokens/second).`,
  },
];

export default function AgentPatternsContent() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>("simple");
  const { state, start, stop, approve, deny, reset } = useAgentRun();
  const { containerRef, isAtBottom, scrollToBottom } = useAutoScroll();

  const isRunning = state.status === "running";
  const isBusy =
    state.status === "running" || state.status === "awaiting_approval";

  const handleRun = () => {
    if (isBusy) return;
    start(selectedScenario);
  };

  return (
    <>
      <PageHeader breadcrumbs={BREADCRUMBS} />

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Intro */}
        <m.section {...fadeInUp} className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Agent UI Patterns
          </h1>
          <p className="text-foreground-secondary text-lg leading-relaxed max-w-2xl">
            Interactive demos of the streaming, state management, and component
            patterns behind modern AI agent interfaces. Select a scenario and
            hit Run to see SSE parsing, tool calls, approval gates, and error
            recovery in action.
          </p>
        </m.section>

        {/* Scenario selector */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground-secondary uppercase tracking-wider">
            Scenario
          </h2>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button type="button"
                key={s.id}
                onClick={() => {
                  if (isBusy) return;
                  setSelectedScenario(s.id);
                  reset();
                }}
                disabled={isBusy}
                className={[
                  "px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer",
                  selectedScenario === s.id
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-surface border-border text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  isBusy && "opacity-50 cursor-not-allowed",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={s.description}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Demo area */}
        <section className="border border-border rounded-xl overflow-hidden">
          {/* Controls */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-surface-raised">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={isBusy}
            >
              Run
            </Button>
            {isRunning && <StopButton onStop={stop} />}
            {state.status === "awaiting_approval" && (
              <span className="text-sm text-warning-600 font-medium">
                Awaiting approval...
              </span>
            )}
            {state.status === "completed" && (
              <span className="text-sm text-green-600 font-medium">
                Completed
              </span>
            )}
            {state.status === "error" && (
              <span className="text-sm text-red-500 font-medium">Error</span>
            )}
            {state.status === "cancelled" && (
              <span className="text-sm text-foreground-secondary font-medium">
                Cancelled
              </span>
            )}
          </div>

          {/* Timeline */}
          <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className="p-4 min-h-[200px] max-h-[500px] overflow-y-auto"
          >
            {state.status === "idle" ? (
              <p className="text-foreground-secondary text-sm italic">
                Select a scenario and click Run to start.
              </p>
            ) : (
              <AgentTimeline
                steps={state.steps}
                onApprove={approve}
                onDeny={deny}
              />
            )}
          </div>

          {/* Scroll to bottom */}
          {!isAtBottom && state.status !== "idle" && (
            <div className="flex justify-center p-2 border-t border-border">
              <button type="button"
                onClick={scrollToBottom}
                className="text-xs text-primary-500 hover:text-primary-600 cursor-pointer"
              >
                Scroll to bottom
              </button>
            </div>
          )}
        </section>

        {/* Explanatory sections */}
        {SECTIONS.map((section) => (
          <m.section
            key={section.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-foreground-secondary leading-relaxed">
              {section.body}
            </p>
            {section.code && (
              <pre className="bg-surface border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <code>{section.code}</code>
              </pre>
            )}
          </m.section>
        ))}
      </main>
    </>
  );
}
