import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AiContentEngineDemo from "../ai-content-engine";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("ai-content-engine")!];

afterEach(() => vi.useRealTimers());

describe("ai content engine demo", () => {
  it("streams the chosen template's output when it is selected", () => {
    vi.useFakeTimers();
    render(<AiContentEngineDemo feature={feature} />);
    // Selecting a template streams it on its own -- the demo never sits on a
    // blank box waiting for a Generate click.
    fireEvent.click(screen.getByRole("button", { name: "Event teaser" }));
    act(() => vi.advanceTimersByTime(3000));
    const out = screen.getByLabelText("Generated output");
    expect(out).toHaveTextContent(/northern reach/);
  });

  it("posts to the chosen platform in the chosen personality", () => {
    vi.useFakeTimers();
    render(<AiContentEngineDemo feature={feature} />);

    // Platform and personality are picked inline on the surface, not in a modal.
    fireEvent.click(screen.getByRole("button", { name: "Reddit" }));
    fireEvent.click(screen.getByRole("button", { name: "Meme Lord" }));
    fireEvent.click(screen.getByRole("button", { name: /^Post to / }));

    expect(screen.getByText(/Posted as Meme Lord/i)).toHaveTextContent(
      /Reddit/,
    );

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByLabelText("Generated output")).toHaveTextContent(
      /no cap/i,
    );
  });
});
