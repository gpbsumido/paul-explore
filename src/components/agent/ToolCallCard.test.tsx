import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import { ToolCallCard } from "./ToolCallCard";
import type { ToolCallStep } from "@/lib/agent/types";

function makeStep(overrides: Partial<ToolCallStep> = {}): ToolCallStep {
  return {
    kind: "tool_call",
    id: "call_123",
    name: "search_db",
    input: { query: "Q4 revenue" },
    status: "running",
    ...overrides,
  };
}

describe("ToolCallCard", () => {
  it("renders the tool name", () => {
    render(<ToolCallCard step={makeStep()} />);

    expect(screen.getByText("search_db")).toBeInTheDocument();
  });

  it("shows a loading indicator when status is running", () => {
    render(<ToolCallCard step={makeStep({ status: "running" })} />);

    expect(screen.getByLabelText("Running")).toBeInTheDocument();
  });

  it("shows a checkmark indicator when status is done", () => {
    render(
      <ToolCallCard step={makeStep({ status: "done", result: "result" })} />,
    );

    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
  });

  it("shows an error indicator when status is error", () => {
    render(
      <ToolCallCard
        step={makeStep({ status: "error", error: "something broke" })}
      />,
    );

    expect(screen.getByLabelText("Error")).toBeInTheDocument();
  });

  it("clicking the header toggles expanded state", async () => {
    const user = userEvent.setup();
    render(<ToolCallCard step={makeStep()} />);

    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/"query"/)).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/"query"/)).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await waitFor(() =>
      expect(screen.queryByText(/"query"/)).not.toBeInTheDocument(),
    );
  });

  it("only shows an indicator for its own status", () => {
    render(<ToolCallCard step={makeStep({ status: "done", result: "ok" })} />);

    expect(screen.queryByLabelText("Running")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Error")).not.toBeInTheDocument();
  });

  it("keeps a result out of the card unless the call finished", () => {
    render(
      <ToolCallCard
        step={makeStep({ status: "running", result: "partial" })}
        defaultExpanded
      />,
    );

    expect(screen.queryByText("partial")).not.toBeInTheDocument();
  });

  it("keeps an error out of the card unless the call failed", () => {
    render(
      <ToolCallCard
        step={makeStep({ status: "done", result: "fine", error: "stale" })}
        defaultExpanded
      />,
    );

    expect(screen.getByText("fine")).toBeInTheDocument();
    expect(screen.queryByText("stale")).not.toBeInTheDocument();
  });

  it("shows nested input as indented JSON", () => {
    render(
      <ToolCallCard
        step={makeStep({ input: { filter: { year: 2025 } } })}
        defaultExpanded
      />,
    );

    expect(document.querySelector("pre")?.textContent).toBe(
      JSON.stringify({ filter: { year: 2025 } }, null, 2),
    );
  });

  it("when expanded, renders the input as formatted JSON", async () => {
    render(<ToolCallCard step={makeStep()} defaultExpanded />);

    expect(screen.getByText(/"query"/)).toBeInTheDocument();
    expect(screen.getByText(/"Q4 revenue"/)).toBeInTheDocument();
  });

  it("when expanded and status is done, renders the result text", () => {
    render(
      <ToolCallCard
        step={makeStep({ status: "done", result: "Q4 revenue: $4.2M" })}
        defaultExpanded
      />,
    );

    expect(screen.getByText("Q4 revenue: $4.2M")).toBeInTheDocument();
  });

  it("when expanded and status is error, renders the error message with error styling", () => {
    render(
      <ToolCallCard
        step={makeStep({ status: "error", error: "connection timeout" })}
        defaultExpanded
      />,
    );

    const errorEl = screen.getByText("connection timeout");
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.closest("[data-error]")).toBeInTheDocument();
  });

  it("keyboard accessible: Enter/Space toggles expanded state", async () => {
    const user = userEvent.setup();
    render(<ToolCallCard step={makeStep()} />);

    const toggle = screen.getByRole("button");
    toggle.focus();

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  describe("axe scans", () => {
    it.each(["running", "done", "error"] as const)(
      "has no violations when status is %s",
      async (status) => {
        const step = makeStep({
          status,
          result: status === "done" ? "result" : undefined,
          error: status === "error" ? "error msg" : undefined,
        });

        const { container } = render(
          <ToolCallCard step={step} defaultExpanded />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      },
    );
  });
});
