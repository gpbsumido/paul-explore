import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AiContentEngineDemo from "../ai-content-engine";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("ai-content-engine")!];

afterEach(() => vi.useRealTimers());

describe("ai content engine demo", () => {
  it("streams output for the chosen template", () => {
    vi.useFakeTimers();
    render(<AiContentEngineDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Event teaser" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    act(() => vi.advanceTimersByTime(3000));
    const out = screen.getByLabelText("Generated output");
    expect(out).toHaveTextContent(/northern reach/);
  });
});
