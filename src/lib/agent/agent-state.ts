import type { AgentRunState, AgentRunAction, AgentStep } from "./types";

export const initialAgentState: AgentRunState = { status: "idle" };

export function agentReducer(
  state: AgentRunState,
  action: AgentRunAction,
): AgentRunState {
  switch (action.type) {
    case "START": {
      if (state.status !== "idle") return state;
      return { status: "running", steps: [] };
    }

    case "APPEND_TEXT": {
      if (state.status !== "running") return state;
      const { steps } = state;
      const last = steps[steps.length - 1];
      if (last?.kind === "text") {
        return {
          ...state,
          steps: [
            ...steps.slice(0, -1),
            { ...last, content: last.content + action.content },
          ],
        };
      }
      return {
        ...state,
        steps: [
          ...steps,
          { kind: "text", content: action.content, isStreaming: true },
        ],
      };
    }

    case "APPEND_THINKING": {
      if (state.status !== "running") return state;
      const { steps } = state;
      const last = steps[steps.length - 1];
      if (last?.kind === "thinking") {
        return {
          ...state,
          steps: [
            ...steps.slice(0, -1),
            { ...last, text: last.text + action.text },
          ],
        };
      }
      return {
        ...state,
        steps: [...steps, { kind: "thinking", text: action.text }],
      };
    }

    case "ADD_TOOL_CALL": {
      if (state.status !== "running") return state;
      return {
        ...state,
        steps: [
          ...state.steps,
          {
            kind: "tool_call",
            id: action.id,
            name: action.name,
            input: action.input,
            status: "running",
          },
        ],
      };
    }

    case "COMPLETE_TOOL_CALL": {
      if (state.status !== "running") return state;
      const idx = state.steps.findIndex(
        (s) => s.kind === "tool_call" && s.id === action.id,
      );
      if (idx === -1) return state;
      const step = state.steps[idx];
      if (step.kind !== "tool_call") return state;

      const updated: AgentStep = action.error
        ? { ...step, status: "error", error: action.error }
        : { ...step, status: "done", result: action.result };

      return {
        ...state,
        steps: [
          ...state.steps.slice(0, idx),
          updated,
          ...state.steps.slice(idx + 1),
        ],
      };
    }

    case "REQUEST_APPROVAL": {
      if (state.status !== "running") return state;
      const pendingAction = {
        kind: "approval_request" as const,
        id: action.id,
        action: action.action,
        description: action.description,
        status: "pending" as const,
      };
      return {
        status: "awaiting_approval",
        steps: [...state.steps, pendingAction],
        pendingAction,
      };
    }

    case "RESOLVE_APPROVAL": {
      if (state.status !== "awaiting_approval") return state;
      const newStatus = action.approved ? "approved" : "denied";
      const updatedSteps = state.steps.map((s) =>
        s.kind === "approval_request" && s.id === state.pendingAction.id
          ? { ...s, status: newStatus as "approved" | "denied" }
          : s,
      );
      if (action.approved) {
        return { status: "running", steps: updatedSteps };
      }
      return { status: "completed", steps: updatedSteps };
    }

    case "COMPLETE": {
      if (state.status !== "running") return state;
      const steps = state.steps.map((s) =>
        s.kind === "text" && s.isStreaming ? { ...s, isStreaming: false } : s,
      );
      return { status: "completed", steps };
    }

    case "ERROR": {
      if (state.status !== "running") return state;
      return { status: "error", steps: state.steps, error: action.error };
    }

    case "CANCEL": {
      if (state.status !== "running") return state;
      return { status: "cancelled", steps: state.steps };
    }
  }
}
