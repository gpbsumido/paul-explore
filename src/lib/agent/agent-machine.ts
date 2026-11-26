import { assign, setup, type SnapshotFrom } from "xstate";
import type {
  AgentRunAction,
  AgentRunState,
  AgentStep,
  ApprovalRequestStep,
} from "./types";

type AgentContext = {
  readonly steps: readonly AgentStep[];
  readonly pendingAction?: ApprovalRequestStep;
  readonly error?: string;
};

/** Grows the trailing step when it matches, otherwise starts a new one. */
function appendToLastStep(
  steps: readonly AgentStep[],
  extend: (last: AgentStep | undefined) => AgentStep | undefined,
  start: () => AgentStep,
): readonly AgentStep[] {
  const last = steps[steps.length - 1];
  const extended = extend(last);
  return extended
    ? [...steps.slice(0, -1), extended]
    : [...steps, start()];
}

/**
 * The agent run as an XState machine. A state only lists the events it
 * accepts, so a late event (text arriving after a cancel, say) is dropped
 * by the machine itself instead of by a guard at the top of every case.
 */
export const agentMachine = setup({
  types: {
    context: {} as AgentContext,
    events: {} as AgentRunAction,
  },
  actions: {
    startFreshRun: assign({
      steps: [],
      pendingAction: undefined,
      error: undefined,
    }),
    appendText: assign({
      steps: ({ context, event }) => {
        if (event.type !== "APPEND_TEXT") return context.steps;
        return appendToLastStep(
          context.steps,
          (last) =>
            last?.kind === "text"
              ? { ...last, content: last.content + event.content }
              : undefined,
          () => ({ kind: "text", content: event.content, isStreaming: true }),
        );
      },
    }),
    appendThinking: assign({
      steps: ({ context, event }) => {
        if (event.type !== "APPEND_THINKING") return context.steps;
        return appendToLastStep(
          context.steps,
          (last) =>
            last?.kind === "thinking"
              ? { ...last, text: last.text + event.text }
              : undefined,
          () => ({ kind: "thinking", text: event.text }),
        );
      },
    }),
    addToolCall: assign({
      steps: ({ context, event }) =>
        event.type === "ADD_TOOL_CALL"
          ? [
              ...context.steps,
              {
                kind: "tool_call",
                id: event.id,
                name: event.name,
                input: event.input,
                status: "running",
              },
            ]
          : context.steps,
    }),
    completeToolCall: assign({
      steps: ({ context, event }) => {
        if (event.type !== "COMPLETE_TOOL_CALL") return context.steps;
        return context.steps.map((step): AgentStep => {
          if (step.kind !== "tool_call" || step.id !== event.id) return step;
          return event.error
            ? { ...step, status: "error", error: event.error }
            : { ...step, status: "done", result: event.result };
        });
      },
    }),
    requestApproval: assign(({ context, event }) => {
      if (event.type !== "REQUEST_APPROVAL") return context;
      const pendingAction: ApprovalRequestStep = {
        kind: "approval_request",
        id: event.id,
        action: event.action,
        description: event.description,
        status: "pending",
      };
      return {
        steps: [...context.steps, pendingAction],
        pendingAction,
      };
    }),
    resolveApproval: assign({
      steps: ({ context, event }) => {
        if (event.type !== "RESOLVE_APPROVAL") return context.steps;
        const resolvedStatus = event.approved ? "approved" : "denied";
        return context.steps.map((step) =>
          step.kind === "approval_request" &&
          step.id === context.pendingAction?.id
            ? { ...step, status: resolvedStatus }
            : step,
        );
      },
      pendingAction: undefined,
    }),
    stopStreamingText: assign({
      steps: ({ context }) =>
        context.steps.map((step) =>
          step.kind === "text" && step.isStreaming
            ? { ...step, isStreaming: false }
            : step,
        ),
    }),
    recordError: assign({
      error: ({ event }) => (event.type === "ERROR" ? event.error : undefined),
    }),
  },
  guards: {
    wasApproved: ({ event }) =>
      event.type === "RESOLVE_APPROVAL" && event.approved,
  },
}).createMachine({
  id: "agentRun",
  initial: "idle",
  context: { steps: [] },
  on: { RESET: { target: ".idle", actions: "startFreshRun" } },
  states: {
    idle: { on: { START: { target: "running", actions: "startFreshRun" } } },
    running: {
      on: {
        APPEND_TEXT: { actions: "appendText" },
        APPEND_THINKING: { actions: "appendThinking" },
        ADD_TOOL_CALL: { actions: "addToolCall" },
        COMPLETE_TOOL_CALL: { actions: "completeToolCall" },
        REQUEST_APPROVAL: {
          target: "awaiting_approval",
          actions: "requestApproval",
        },
        COMPLETE: { target: "completed", actions: "stopStreamingText" },
        ERROR: { target: "error", actions: "recordError" },
        CANCEL: "cancelled",
      },
    },
    awaiting_approval: {
      on: {
        RESOLVE_APPROVAL: [
          { guard: "wasApproved", target: "running", actions: "resolveApproval" },
          { target: "completed", actions: "resolveApproval" },
        ],
      },
    },
    completed: { on: { START: { target: "running", actions: "startFreshRun" } } },
    error: { on: { START: { target: "running", actions: "startFreshRun" } } },
    cancelled: { on: { START: { target: "running", actions: "startFreshRun" } } },
  },
});

/**
 * Reads a machine snapshot back as the AgentRunState union the UI renders,
 * so components keep narrowing on `status` and never see XState types.
 */
export function toRunState(
  snapshot: SnapshotFrom<typeof agentMachine>,
): AgentRunState {
  const { steps, pendingAction, error } = snapshot.context;
  switch (snapshot.value) {
    case "idle":
      return { status: "idle" };
    case "running":
      return { status: "running", steps };
    case "awaiting_approval":
      if (!pendingAction) throw new Error("awaiting_approval without a pendingAction");
      return { status: "awaiting_approval", steps, pendingAction };
    case "completed":
      return { status: "completed", steps };
    case "error":
      if (error === undefined) throw new Error("error state without an error message");
      return { status: "error", steps, error };
    case "cancelled":
      return { status: "cancelled", steps };
    default:
      throw new Error(`unknown agent state: ${JSON.stringify(snapshot.value)}`);
  }
}
