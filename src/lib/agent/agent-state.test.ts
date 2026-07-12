import { describe, it, expect } from "vitest";
import { agentReducer, initialAgentState } from "./agent-state";
import type { AgentRunState, AgentRunAction, AgentStep } from "./types";

function reduce(state: AgentRunState, action: AgentRunAction): AgentRunState {
  return agentReducer(Object.freeze(state) as AgentRunState, action);
}

const running = (
  steps: readonly AgentStep[] = [],
): AgentRunState & { status: "running" } => ({
  status: "running",
  steps,
});

describe("agentReducer", () => {
  it("initial state is idle", () => {
    expect(initialAgentState).toEqual({ status: "idle" });
  });

  // --- START ---

  it("START transitions idle to running with empty steps", () => {
    const result = reduce(initialAgentState, { type: "START" });
    expect(result).toEqual({ status: "running", steps: [] });
  });

  it("START on non-idle state returns state unchanged", () => {
    const state = running([]);
    const result = reduce(state, { type: "START" });
    expect(result).toBe(state);
  });

  // --- APPEND_TEXT ---

  it("APPEND_TEXT creates a new text step when last step is not text", () => {
    const result = reduce(running(), { type: "APPEND_TEXT", content: "Hello" });

    expect(result).toEqual({
      status: "running",
      steps: [{ kind: "text", content: "Hello", isStreaming: true }],
    });
  });

  it("APPEND_TEXT appends to existing text step", () => {
    const state = running([
      { kind: "text", content: "Hello", isStreaming: true },
    ]);
    const result = reduce(state, { type: "APPEND_TEXT", content: " world" });

    expect(result).toEqual({
      status: "running",
      steps: [{ kind: "text", content: "Hello world", isStreaming: true }],
    });
  });

  it("APPEND_TEXT creates new text step after a non-text step", () => {
    const state = running([{ kind: "thinking", text: "hmm" }]);
    const result = reduce(state, { type: "APPEND_TEXT", content: "Answer" });

    expect(result.status).toBe("running");
    if (result.status === "running") {
      expect(result.steps).toHaveLength(2);
      expect(result.steps[1]).toEqual({
        kind: "text",
        content: "Answer",
        isStreaming: true,
      });
    }
  });

  it("APPEND_TEXT on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, {
      type: "APPEND_TEXT",
      content: "nope",
    });
    expect(result).toBe(initialAgentState);
  });

  // --- APPEND_THINKING ---

  it("APPEND_THINKING creates a new thinking step when last step is not thinking", () => {
    const result = reduce(running(), {
      type: "APPEND_THINKING",
      text: "Let me think",
    });

    expect(result).toEqual({
      status: "running",
      steps: [{ kind: "thinking", text: "Let me think" }],
    });
  });

  it("APPEND_THINKING appends to existing thinking step", () => {
    const state = running([{ kind: "thinking", text: "Let me" }]);
    const result = reduce(state, {
      type: "APPEND_THINKING",
      text: " think more",
    });

    expect(result).toEqual({
      status: "running",
      steps: [{ kind: "thinking", text: "Let me think more" }],
    });
  });

  it("APPEND_THINKING on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, {
      type: "APPEND_THINKING",
      text: "nope",
    });
    expect(result).toBe(initialAgentState);
  });

  // --- ADD_TOOL_CALL ---

  it("ADD_TOOL_CALL adds a tool_call step with status running", () => {
    const result = reduce(running(), {
      type: "ADD_TOOL_CALL",
      id: "call_1",
      name: "search_db",
      input: { query: "revenue" },
    });

    expect(result).toEqual({
      status: "running",
      steps: [
        {
          kind: "tool_call",
          id: "call_1",
          name: "search_db",
          input: { query: "revenue" },
          status: "running",
        },
      ],
    });
  });

  it("ADD_TOOL_CALL on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, {
      type: "ADD_TOOL_CALL",
      id: "call_1",
      name: "search_db",
      input: {},
    });
    expect(result).toBe(initialAgentState);
  });

  // --- COMPLETE_TOOL_CALL ---

  it("COMPLETE_TOOL_CALL updates tool status to done with result", () => {
    const state = running([
      {
        kind: "tool_call",
        id: "call_1",
        name: "search_db",
        input: { query: "revenue" },
        status: "running",
      },
    ]);
    const result = reduce(state, {
      type: "COMPLETE_TOOL_CALL",
      id: "call_1",
      result: "Q4 revenue: $4.2M",
    });

    if (result.status === "running") {
      const step = result.steps[0];
      expect(step).toEqual({
        kind: "tool_call",
        id: "call_1",
        name: "search_db",
        input: { query: "revenue" },
        status: "done",
        result: "Q4 revenue: $4.2M",
      });
    } else {
      expect.unreachable("expected running state");
    }
  });

  it("COMPLETE_TOOL_CALL updates tool status to error", () => {
    const state = running([
      {
        kind: "tool_call",
        id: "call_1",
        name: "search_db",
        input: {},
        status: "running",
      },
    ]);
    const result = reduce(state, {
      type: "COMPLETE_TOOL_CALL",
      id: "call_1",
      error: "Connection timeout",
    });

    if (result.status === "running") {
      const step = result.steps[0];
      if (step.kind === "tool_call") {
        expect(step.status).toBe("error");
        expect(step.error).toBe("Connection timeout");
      }
    }
  });

  it("COMPLETE_TOOL_CALL with unknown id returns state unchanged", () => {
    const state = running([
      {
        kind: "tool_call",
        id: "call_1",
        name: "search_db",
        input: {},
        status: "running",
      },
    ]);
    const result = reduce(state, {
      type: "COMPLETE_TOOL_CALL",
      id: "call_99",
      result: "nope",
    });
    expect(result).toBe(state);
  });

  // --- REQUEST_APPROVAL ---

  it("REQUEST_APPROVAL transitions to awaiting_approval", () => {
    const state = running([
      { kind: "text", content: "I want to", isStreaming: true },
    ]);
    const result = reduce(state, {
      type: "REQUEST_APPROVAL",
      id: "approval_1",
      action: "delete_file",
      description: "Delete config.json",
    });

    expect(result.status).toBe("awaiting_approval");
    if (result.status === "awaiting_approval") {
      expect(result.pendingAction).toEqual({
        kind: "approval_request",
        id: "approval_1",
        action: "delete_file",
        description: "Delete config.json",
        status: "pending",
      });
      expect(result.steps).toHaveLength(2);
      expect(result.steps[1]).toEqual(result.pendingAction);
    }
  });

  it("REQUEST_APPROVAL on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, {
      type: "REQUEST_APPROVAL",
      id: "a1",
      action: "x",
      description: "y",
    });
    expect(result).toBe(initialAgentState);
  });

  // --- RESOLVE_APPROVAL ---

  it("RESOLVE_APPROVAL approved transitions back to running", () => {
    const pendingAction = {
      kind: "approval_request" as const,
      id: "approval_1",
      action: "delete_file",
      description: "Delete config.json",
      status: "pending" as const,
    };
    const state: AgentRunState = {
      status: "awaiting_approval",
      steps: [pendingAction],
      pendingAction,
    };
    const result = reduce(state, {
      type: "RESOLVE_APPROVAL",
      approved: true,
    });

    expect(result.status).toBe("running");
    if (result.status === "running") {
      expect(result.steps[0]).toEqual({
        ...pendingAction,
        status: "approved",
      });
    }
  });

  it("RESOLVE_APPROVAL denied transitions to completed", () => {
    const pendingAction = {
      kind: "approval_request" as const,
      id: "approval_1",
      action: "delete_file",
      description: "Delete config.json",
      status: "pending" as const,
    };
    const state: AgentRunState = {
      status: "awaiting_approval",
      steps: [pendingAction],
      pendingAction,
    };
    const result = reduce(state, {
      type: "RESOLVE_APPROVAL",
      approved: false,
    });

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.steps[0]).toEqual({
        ...pendingAction,
        status: "denied",
      });
    }
  });

  it("RESOLVE_APPROVAL on non-awaiting state returns state unchanged", () => {
    const state = running();
    const result = reduce(state, {
      type: "RESOLVE_APPROVAL",
      approved: true,
    });
    expect(result).toBe(state);
  });

  // --- COMPLETE ---

  it("COMPLETE marks last text step as not streaming and transitions to completed", () => {
    const state = running([
      { kind: "text", content: "Final answer.", isStreaming: true },
    ]);
    const result = reduce(state, { type: "COMPLETE" });

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.steps[0]).toEqual({
        kind: "text",
        content: "Final answer.",
        isStreaming: false,
      });
    }
  });

  it("COMPLETE with no text steps still transitions to completed", () => {
    const state = running([{ kind: "thinking", text: "hmm" }]);
    const result = reduce(state, { type: "COMPLETE" });

    expect(result.status).toBe("completed");
  });

  it("COMPLETE on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, { type: "COMPLETE" });
    expect(result).toBe(initialAgentState);
  });

  // --- ERROR ---

  it("ERROR transitions to error with message and preserves steps", () => {
    const state = running([
      { kind: "text", content: "partial", isStreaming: true },
    ]);
    const result = reduce(state, {
      type: "ERROR",
      error: "Stream interrupted",
    });

    expect(result).toEqual({
      status: "error",
      steps: [{ kind: "text", content: "partial", isStreaming: true }],
      error: "Stream interrupted",
    });
  });

  it("ERROR on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, {
      type: "ERROR",
      error: "nope",
    });
    expect(result).toBe(initialAgentState);
  });

  // --- CANCEL ---

  it("CANCEL transitions to cancelled and preserves steps", () => {
    const state = running([
      { kind: "text", content: "partial content", isStreaming: true },
    ]);
    const result = reduce(state, { type: "CANCEL" });

    expect(result).toEqual({
      status: "cancelled",
      steps: [{ kind: "text", content: "partial content", isStreaming: true }],
    });
  });

  it("CANCEL on idle returns state unchanged", () => {
    const result = reduce(initialAgentState, { type: "CANCEL" });
    expect(result).toBe(initialAgentState);
  });

  // --- Immutability ---

  it("produces new objects on every transition (frozen input does not throw)", () => {
    const frozen = Object.freeze({ status: "idle" as const });
    const result = agentReducer(frozen, { type: "START" });
    expect(result).not.toBe(frozen);
    expect(result.status).toBe("running");
  });
});
