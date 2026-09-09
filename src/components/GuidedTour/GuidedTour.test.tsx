import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import GuidedTour from "./GuidedTour";
import type { TourStep } from "./types";

function makeSteps(onEnter1 = vi.fn(), onEnter2 = vi.fn()): TourStep[] {
  return [
    { title: "Take a tour?", body: "A quick walk-through." },
    { anchor: "stop-one", title: "First stop", body: "Here you do a thing.", onEnter: onEnter1 },
    { anchor: "stop-two", title: "Second stop", body: "Here you do another.", onEnter: onEnter2 },
  ];
}

describe("GuidedTour", () => {
  it("opens on the consent step and asks before touring", () => {
    render(<GuidedTour label="Demo" steps={makeSteps()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: /tour/i });
    expect(within(dialog).getByText("Take a tour?")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /show me around/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /no thanks/i })).toBeInTheDocument();
  });

  it("walks the steps, firing each step's onEnter, then finishes", () => {
    const onEnter1 = vi.fn();
    const onEnter2 = vi.fn();
    const onClose = vi.fn();
    render(<GuidedTour label="Demo" steps={makeSteps(onEnter1, onEnter2)} onClose={onClose} />);
    const dialog = () => screen.getByRole("dialog", { name: /tour/i });

    fireEvent.click(within(dialog()).getByRole("button", { name: /show me around/i }));
    expect(within(dialog()).getByText("First stop")).toBeInTheDocument();
    expect(onEnter1).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog()).getByRole("button", { name: /next/i }));
    expect(within(dialog()).getByText("Second stop")).toBeInTheDocument();
    expect(onEnter2).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog()).getByRole("button", { name: /finish/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the visitor declines on the consent step", () => {
    const onClose = vi.fn();
    render(<GuidedTour label="Demo" steps={makeSteps()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /no thanks/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<GuidedTour label="Demo" steps={makeSteps()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog", { name: /tour/i }), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations while open", async () => {
    render(<GuidedTour label="Demo" steps={makeSteps()} onClose={vi.fn()} />);
    // The overlay portals to document.body, so scan there rather than the
    // render container.
    expect(await axe(document.body)).toHaveNoViolations();
  }, 30000);
});
