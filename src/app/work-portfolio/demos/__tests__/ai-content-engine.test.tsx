import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
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

  it("posts to social in a chosen character voice", () => {
    vi.useFakeTimers();
    render(<AiContentEngineDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Post to social" }));

    const dialog = screen.getByRole("dialog", { name: "Post to social" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Meme Lord" }));
    // preview restyles the copy in the chosen voice
    expect(within(dialog).getByText(/no cap/i)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Post" }));
    expect(screen.getByText(/Posted as Meme Lord/i)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByLabelText("Generated output")).toHaveTextContent(/no cap/i);
  });
});
