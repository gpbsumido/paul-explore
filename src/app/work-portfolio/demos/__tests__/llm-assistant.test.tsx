import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LlmAssistantDemo from "../llm-assistant";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("llm-assistant")!];

afterEach(() => vi.useRealTimers());

describe("llm assistant demo", () => {
  it("streams a canned answer in response to a suggestion", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    // the user's message shows immediately (button label + bubble = 2)
    expect(screen.getAllByText("How is retention?").length).toBeGreaterThan(1);
    // the answer fills in as words stream
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/D1 retention/)).toBeInTheDocument();
  });

  it("shows a tool-call row that runs before the answer streams", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    // the tool call appears immediately, running
    const tool = screen.getByTestId("tool-call");
    expect(tool).toHaveTextContent("query_warehouse");
    // after the tool finishes, the answer streams in
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByText(/D1 retention/)).toBeInTheDocument();
  });

  it("routes different prompts to different answers", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "tell me about revenue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/Revenue is up/)).toBeInTheDocument();
  });
});
