/** A single parsed SSE frame from the wire format. */
export type SSEEvent = {
  readonly event: string;
  readonly data: string;
  readonly id?: string;
  readonly retry?: number;
};

// ---------------------------------------------------------------------------
// Agent step types — each variant represents a distinct phase of an agent run
// ---------------------------------------------------------------------------

export type ThinkingStep = {
  readonly kind: "thinking";
  readonly text: string;
};

export type TextStep = {
  readonly kind: "text";
  readonly content: string;
  readonly isStreaming: boolean;
};

export type ToolCallStep = {
  readonly kind: "tool_call";
  readonly id: string;
  readonly name: string;
  readonly input: Record<string, unknown>;
  readonly status: "running" | "done" | "error";
  readonly result?: string;
  readonly error?: string;
};

export type ApprovalRequestStep = {
  readonly kind: "approval_request";
  readonly id: string;
  readonly action: string;
  readonly description: string;
  readonly status: "pending" | "approved" | "denied";
};

export type ErrorStep = {
  readonly kind: "error";
  readonly message: string;
};

export type AgentStep =
  | ThinkingStep
  | TextStep
  | ToolCallStep
  | ApprovalRequestStep
  | ErrorStep;

// ---------------------------------------------------------------------------
// Agent run state machine — discriminated union on status
// ---------------------------------------------------------------------------

export type AgentRunState =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly steps: readonly AgentStep[] }
  | {
      readonly status: "awaiting_approval";
      readonly steps: readonly AgentStep[];
      readonly pendingAction: ApprovalRequestStep;
    }
  | { readonly status: "completed"; readonly steps: readonly AgentStep[] }
  | {
      readonly status: "error";
      readonly steps: readonly AgentStep[];
      readonly error: string;
    }
  | { readonly status: "cancelled"; readonly steps: readonly AgentStep[] };

// ---------------------------------------------------------------------------
// Reducer actions
// ---------------------------------------------------------------------------

export type AgentRunAction =
  | { readonly type: "START" }
  | { readonly type: "APPEND_TEXT"; readonly content: string }
  | { readonly type: "APPEND_THINKING"; readonly text: string }
  | {
      readonly type: "ADD_TOOL_CALL";
      readonly id: string;
      readonly name: string;
      readonly input: Record<string, unknown>;
    }
  | {
      readonly type: "COMPLETE_TOOL_CALL";
      readonly id: string;
      readonly result?: string;
      readonly error?: string;
    }
  | {
      readonly type: "REQUEST_APPROVAL";
      readonly id: string;
      readonly action: string;
      readonly description: string;
    }
  | { readonly type: "RESOLVE_APPROVAL"; readonly approved: boolean }
  | { readonly type: "COMPLETE" }
  | { readonly type: "ERROR"; readonly error: string }
  | { readonly type: "CANCEL" }
  | { readonly type: "RESET" };

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

export type Scenario =
  | "simple"
  | "tool_calls"
  | "thinking"
  | "approval"
  | "error_recovery";

export type ScenarioMeta = {
  readonly id: Scenario;
  readonly label: string;
  readonly description: string;
};
