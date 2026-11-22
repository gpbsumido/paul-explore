import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LiquidGlass from "./LiquidGlass";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

describe("LiquidGlass", () => {
  it("renders its children on the glass surface", () => {
    render(
      <LiquidGlass>
        <p>Bet slip</p>
      </LiquidGlass>,
    );
    const content = screen.getByText("Bet slip");
    expect(content).toBeInTheDocument();
    expect(content.closest(".motion-liquid-glass")).not.toBeNull();
  });

  it("carries a drifting specular sheen", () => {
    const { container } = render(
      <LiquidGlass as="section">
        <p>hi</p>
      </LiquidGlass>,
    );
    expect(container.querySelector("section.motion-liquid-glass")).not.toBeNull();
    expect(container.querySelector(".motion-liquid-glass__sheen")).not.toBeNull();
  });

  it("keeps the frosted surface but holds the sheen still under reduced motion", () => {
    mocks.reduced = true;
    const { container } = render(
      <LiquidGlass>
        <p>hi</p>
      </LiquidGlass>,
    );
    const surface = container.firstElementChild;
    expect(surface).toHaveClass("motion-liquid-glass", "motion-liquid-glass--static");
    expect(container.querySelector(".motion-liquid-glass__sheen")).not.toBeNull();
  });

  it("only drifts when motion is allowed, and keeps the caller's classes", () => {
    const { container } = render(
      <LiquidGlass className="p-4">
        <p>hi</p>
      </LiquidGlass>,
    );
    const surface = container.firstElementChild;
    expect(surface).toHaveClass("motion-liquid-glass", "p-4");
    expect(surface).not.toHaveClass("motion-liquid-glass--static");
  });

  it("hides the sheen from assistive tech", () => {
    const { container } = render(
      <LiquidGlass>
        <p>hi</p>
      </LiquidGlass>,
    );
    expect(container.querySelector(".motion-liquid-glass__sheen")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
