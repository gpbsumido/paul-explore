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
    expect(screen.getAllByText("How is retention?").length).toBeGreaterThan(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/D1 retention/)).toBeInTheDocument();
  });

  it("shows a tool-call row that runs before the answer streams", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    const tool = screen.getByTestId("tool-call");
    expect(tool).toHaveTextContent("query_warehouse");
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

  it("streaming completes and re-enables the composer, with citations", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    expect(screen.getByText(/\[1\]/)).toBeInTheDocument();
  });

  it("stops an in-progress stream and leaves the partial answer", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    act(() => vi.advanceTimersByTime(700));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    const partial = screen.getByTestId("assistant-text").textContent;
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("assistant-text").textContent).toBe(partial);
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("re-runs the last answer when retry is clicked", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("shows a plan in agent mode and hides it in chat mode", () => {
    vi.useFakeTimers();
    render(<LlmAssistantDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "How is retention?" }));
    expect(screen.getByTestId("agent-plan")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Chat" }));
    fireEvent.click(screen.getByRole("button", { name: "What about revenue?" }));
    expect(screen.queryByTestId("agent-plan")).toBeNull();
  });
});
