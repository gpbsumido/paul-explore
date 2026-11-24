import { useCallback, useMemo, useRef } from "react";
import { useMachine } from "@xstate/react";
import { agentMachine, toRunState } from "@/lib/agent/agent-machine";
import { createMockStream } from "@/lib/agent/mock-stream";
import { createSSEParser } from "@/lib/agent/sse-parser";
import type { Scenario, AgentRunState } from "@/lib/agent/types";

type AgentRunResult = {
  readonly state: AgentRunState;
  readonly start: (scenario: Scenario) => void;
  readonly stop: () => void;
  readonly approve: () => void;
  readonly deny: () => void;
  readonly reset: () => void;
};

/**
 * Orchestrator hook that wires together the agent XState machine,
 * mock stream, SSE parser, and AbortController. Dispatches reducer
 * actions based on parsed SSE event types.
 */
export function useAgentRun(): AgentRunResult {
  const [snapshot, send] = useMachine(agentMachine);
  const state = useMemo(() => toRunState(snapshot), [snapshot]);

  const abortRef = useRef<AbortController | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);

  const start = useCallback(
    (scenario: Scenario) => {
      if (!snapshot.can({ type: "START" })) return;

      const controller = new AbortController();
      abortRef.current = controller;

      send({ type: "START" });

      const { stream, resume } = createMockStream(scenario);
      resumeRef.current = resume;

      const parser = createSSEParser();
      const reader = stream.getReader();

      const read = async () => {
        try {
          while (true) {
            if (controller.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;

            const events = parser.feed(value);
            for (const event of events) {
              if (controller.signal.aborted) break;
              const data = JSON.parse(event.data) as Record<string, unknown>;

              switch (event.event) {
                case "text_delta":
                  send({
                    type: "APPEND_TEXT",
                    content: data.content as string,
                  });
                  break;
                case "thinking":
                  send({
                    type: "APPEND_THINKING",
                    text: data.text as string,
                  });
                  break;
                case "tool_use_start":
                  send({
                    type: "ADD_TOOL_CALL",
                    id: data.id as string,
                    name: data.name as string,
                    input: data.input as Record<string, unknown>,
                  });
                  break;
                case "tool_result":
                  send({
                    type: "COMPLETE_TOOL_CALL",
                    id: data.id as string,
                    result: data.is_error ? undefined : (data.output as string),
                    error: data.is_error ? (data.output as string) : undefined,
                  });
                  break;
                case "approval_request":
                  send({
                    type: "REQUEST_APPROVAL",
                    id: data.id as string,
                    action: data.action as string,
                    description: data.description as string,
                  });
                  break;
                case "done":
                  send({ type: "COMPLETE" });
                  break;
                case "error":
                  send({
                    type: "ERROR",
                    error: data.message as string,
                  });
                  break;
              }
            }
          }
        } catch {
          // reader cancelled or aborted
        }
      };

      void read();
    },
    [snapshot, send],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    send({ type: "CANCEL" });
  }, [send]);

  const approve = useCallback(() => {
    resumeRef.current?.();
    resumeRef.current = null;
    send({ type: "RESOLVE_APPROVAL", approved: true });
  }, [send]);

  const deny = useCallback(() => {
    send({ type: "RESOLVE_APPROVAL", approved: false });
  }, [send]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    send({ type: "RESET" });
  }, [send]);

  return { state, start, stop, approve, deny, reset };
}
