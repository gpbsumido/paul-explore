import { useReducer, useCallback, useRef } from "react";
import { agentReducer, initialAgentState } from "@/lib/agent/agent-state";
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
 * Orchestrator hook that wires together the agent state machine,
 * mock stream, SSE parser, and AbortController. Dispatches reducer
 * actions based on parsed SSE event types.
 */
export function useAgentRun(): AgentRunResult {
  const [state, dispatch] = useReducer(agentReducer, initialAgentState);

  const abortRef = useRef<AbortController | null>(null);
  const resumeRef = useRef<(() => void) | null>(null);

  const start = useCallback(
    (scenario: Scenario) => {
      if (state.status === "running" || state.status === "awaiting_approval")
        return;

      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: "START" });

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
                  dispatch({
                    type: "APPEND_TEXT",
                    content: data.content as string,
                  });
                  break;
                case "thinking":
                  dispatch({
                    type: "APPEND_THINKING",
                    text: data.text as string,
                  });
                  break;
                case "tool_use_start":
                  dispatch({
                    type: "ADD_TOOL_CALL",
                    id: data.id as string,
                    name: data.name as string,
                    input: data.input as Record<string, unknown>,
                  });
                  break;
                case "tool_result":
                  dispatch({
                    type: "COMPLETE_TOOL_CALL",
                    id: data.id as string,
                    result: data.is_error ? undefined : (data.output as string),
                    error: data.is_error ? (data.output as string) : undefined,
                  });
                  break;
                case "approval_request":
                  dispatch({
                    type: "REQUEST_APPROVAL",
                    id: data.id as string,
                    action: data.action as string,
                    description: data.description as string,
                  });
                  break;
                case "done":
                  dispatch({ type: "COMPLETE" });
                  break;
                case "error":
                  dispatch({
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
    [state.status],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "CANCEL" });
  }, []);

  const approve = useCallback(() => {
    resumeRef.current?.();
    resumeRef.current = null;
    dispatch({ type: "RESOLVE_APPROVAL", approved: true });
  }, []);

  const deny = useCallback(() => {
    dispatch({ type: "RESOLVE_APPROVAL", approved: false });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  return { state, start, stop, approve, deny, reset };
}
