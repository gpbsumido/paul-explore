import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import { AgentTimeline } from "./AgentTimeline";
import type { AgentStep } from "@/lib/agent/types";

const thinkingStep: AgentStep = { kind: "thinking", text: "Let me analyze..." };

const textStep: AgentStep = {
  kind: "text",
  content: "The answer is **42**.",
  isStreaming: false,
};

const toolCallStep: AgentStep = {
  kind: "tool_call",
  id: "call_1",
  name: "search_db",
  input: { query: "revenue" },
  status: "done",
  result: "$4.2M",
};

const approvalStep: AgentStep = {
  kind: "approval_request",
  id: "approval_1",
  action: "delete_file",
  description: "Delete config.json",
  status: "pending",
};

const errorStep: AgentStep = {
  kind: "error",
  message: "Connection reset",
};

describe("AgentTimeline", () => {
  it("renders nothing when steps array is empty", () => {
    const { container } = render(<AgentTimeline steps={[]} />);

    // the timeline container should have no step children
    expect(container.querySelector("[data-step]")).not.toBeInTheDocument();
  });

  it("renders a thinking step with the thinking text", () => {
    render(<AgentTimeline steps={[thinkingStep]} />);

    expect(screen.getByText("Let me analyze...")).toBeInTheDocument();
  });

  it("renders a text step using StreamingMarkdown", () => {
    render(<AgentTimeline steps={[textStep]} />);

    expect(screen.getByText("42").tagName).toBe("STRONG");
  });

  it("renders a tool_call step using ToolCallCard", () => {
    render(<AgentTimeline steps={[toolCallStep]} />);

    expect(screen.getByText("search_db")).toBeInTheDocument();
    expect(screen.getByTestId("status-done")).toBeInTheDocument();
  });

  it("renders an approval_request step using ApprovalGate", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(
      <AgentTimeline
        steps={[approvalStep]}
        onApprove={onApprove}
        onDeny={onDeny}
      />,
    );

    expect(screen.getByText("delete_file")).toBeInTheDocument();
    expect(screen.getByText("Delete config.json")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve/i }),
    ).toBeInTheDocument();
  });

  it("renders an error step as an error banner with the message", () => {
    render(<AgentTimeline steps={[errorStep]} />);

    const errorEl = screen.getByText("Connection reset");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.closest("[data-error-banner]")).toBeInTheDocument();
  });

  it("renders multiple steps in order", () => {
    render(<AgentTimeline steps={[thinkingStep, textStep, errorStep]} />);

    const allSteps = document.querySelectorAll("[data-step]");
    expect(allSteps).toHaveLength(3);
  });

  it("has no axe violations with a mix of step types", async () => {
    const { container } = render(
      <AgentTimeline
        steps={[thinkingStep, textStep, toolCallStep, errorStep]}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
