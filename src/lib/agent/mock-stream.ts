import type { Scenario, ScenarioMeta } from "./types";

export const SCENARIOS: readonly ScenarioMeta[] = [
  {
    id: "simple",
    label: "Simple Response",
    description: "Thinking phase followed by a streamed text response.",
  },
  {
    id: "tool_calls",
    label: "Tool Calls",
    description:
      "Agent reasons, calls a tool, waits for the result, then responds.",
  },
  {
    id: "thinking",
    label: "Extended Thinking",
    description: "Long reasoning chain before producing a short answer.",
  },
  {
    id: "approval",
    label: "Approval Gate",
    description:
      "Agent requests human approval before executing a dangerous action.",
  },
  {
    id: "error_recovery",
    label: "Error Recovery",
    description: "Stream interrupts mid-response and recovers with a retry.",
  },
];

// ---------------------------------------------------------------------------
// SSE frame helper
// ---------------------------------------------------------------------------

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// Scenario scripts — each returns an array of { delayMs, frame } entries
// ---------------------------------------------------------------------------

type ScriptEntry =
  | { delayMs: number; frame: string }
  | { delayMs: number; pause: true };

function simpleScript(): readonly ScriptEntry[] {
  return [
    { delayMs: 40, frame: sseFrame("thinking", { text: "Let me " }) },
    { delayMs: 40, frame: sseFrame("thinking", { text: "analyze this..." }) },
    { delayMs: 60, frame: sseFrame("text_delta", { content: "Based on " }) },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "my analysis, " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "the answer is " }),
    },
    { delayMs: 40, frame: sseFrame("text_delta", { content: "**42**." }) },
    { delayMs: 30, frame: sseFrame("done", {}) },
  ];
}

function toolCallsScript(): readonly ScriptEntry[] {
  return [
    {
      delayMs: 40,
      frame: sseFrame("thinking", { text: "I need to look this up..." }),
    },
    {
      delayMs: 60,
      frame: sseFrame("text_delta", { content: "Let me search " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "the database." }),
    },
    {
      delayMs: 80,
      frame: sseFrame("tool_use_start", {
        id: "call_abc123",
        name: "search_db",
        input: { query: "Q4 revenue" },
      }),
    },
    {
      delayMs: 200,
      frame: sseFrame("tool_result", {
        id: "call_abc123",
        output: "Q4 revenue: $4.2M, up 12% YoY",
        is_error: false,
      }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "The Q4 revenue " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "was **$4.2M**, " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "up 12% year-over-year." }),
    },
    { delayMs: 30, frame: sseFrame("done", {}) },
  ];
}

function thinkingScript(): readonly ScriptEntry[] {
  const thinkingTokens = [
    "Okay, ",
    "let me think ",
    "about this carefully. ",
    "First, I should consider ",
    "the constraints. ",
    "The key insight is ",
    "that we need to balance ",
    "performance with correctness. ",
    "Let me verify my reasoning...",
  ];

  const entries: ScriptEntry[] = thinkingTokens.map((text) => ({
    delayMs: 50,
    frame: sseFrame("thinking", { text }),
  }));

  entries.push(
    {
      delayMs: 60,
      frame: sseFrame("text_delta", { content: "After careful " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "consideration, " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "the optimal approach " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "is to use a **hash map**." }),
    },
    { delayMs: 30, frame: sseFrame("done", {}) },
  );

  return entries;
}

function approvalScript(): readonly ScriptEntry[] {
  return [
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "I'll need to " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "delete the old config. " }),
    },
    {
      delayMs: 80,
      frame: sseFrame("approval_request", {
        id: "approval_1",
        action: "delete_file",
        description: "Delete config.json from the project root",
      }),
    },
    // stream pauses here until resume() is called
    { delayMs: 0, pause: true },
    { delayMs: 50, frame: sseFrame("text_delta", { content: "Done! " }) },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", {
        content: "The old config has been removed ",
      }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", {
        content: "and a fresh one generated.",
      }),
    },
    { delayMs: 30, frame: sseFrame("done", {}) },
  ];
}

function errorRecoveryScript(): readonly ScriptEntry[] {
  return [
    { delayMs: 50, frame: sseFrame("text_delta", { content: "Starting " }) },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "the analysis " }),
    },
    { delayMs: 50, frame: sseFrame("text_delta", { content: "now..." }) },
    {
      delayMs: 100,
      frame: sseFrame("error", {
        message: "Stream interrupted: connection reset",
        recoverable: true,
      }),
    },
    {
      delayMs: 200,
      frame: sseFrame("text_delta", { content: "Recovered. " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "Resuming where " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "I left off. " }),
    },
    {
      delayMs: 50,
      frame: sseFrame("text_delta", { content: "The result is **complete**." }),
    },
    { delayMs: 30, frame: sseFrame("done", {}) },
  ];
}

function scriptFor(scenario: Scenario): readonly ScriptEntry[] {
  switch (scenario) {
    case "simple":
      return simpleScript();
    case "tool_calls":
      return toolCallsScript();
    case "thinking":
      return thinkingScript();
    case "approval":
      return approvalScript();
    case "error_recovery":
      return errorRecoveryScript();
  }
}

// ---------------------------------------------------------------------------
// Stream factory
// ---------------------------------------------------------------------------

export function createMockStream(scenario: Scenario): {
  stream: ReadableStream<string>;
  resume: () => void;
} {
  const script = scriptFor(scenario);
  let cancelled = false;
  let resumeCallback: (() => void) | null = null;

  const stream = new ReadableStream<string>({
    async start(controller) {
      let elapsed = 0;

      for (const entry of script) {
        if (cancelled) break;

        if ("pause" in entry) {
          // wait for resume() to be called
          await new Promise<void>((resolve) => {
            resumeCallback = resolve;
          });
          if (cancelled) break;
          continue;
        }

        if (entry.delayMs > 0) {
          await new Promise<void>((resolve) => {
            const timer = setTimeout(() => resolve(), entry.delayMs);
            // store cleanup ref — not strictly needed for tests but good practice
            elapsed += entry.delayMs;
            void timer;
            void elapsed;
          });
        }

        if (cancelled) break;

        try {
          controller.enqueue(entry.frame);
        } catch {
          // controller may be closed if reader cancelled
          break;
        }
      }

      if (!cancelled) {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      cancelled = true;
      // if paused, unblock so the loop can exit
      resumeCallback?.();
    },
  });

  return {
    stream,
    resume() {
      resumeCallback?.();
      resumeCallback = null;
    },
  };
}
