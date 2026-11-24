import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BlurReveal from "./BlurReveal";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

describe("BlurReveal", () => {
  it("renders its children", () => {
    render(<BlurReveal>Biggest underdog</BlurReveal>);
    expect(screen.getByText("Biggest underdog")).toBeInTheDocument();
  });

  it("animates by default and honours a custom element and delay", () => {
    render(
      <BlurReveal as="h3" delayMs={120}>
        Closest game
      </BlurReveal>,
    );
    const el = screen.getByText("Closest game");
    expect(el.tagName).toBe("H3");
    expect(el).toHaveClass("motion-blur-reveal");
    expect(el.style.animationDelay).toBe("120ms");
  });

  it("is simply present, with no animation or delay, under reduced motion", () => {
    mocks.reduced = true;
    render(<BlurReveal delayMs={120}>Closest game</BlurReveal>);
    const el = screen.getByText("Closest game");
    expect(el).not.toHaveClass("motion-blur-reveal");
    expect(el.style.animationDelay).toBe("");
  });

  it("sets no delay at all when none was asked for, and keeps the caller's classes", () => {
    render(<BlurReveal className="text-lg">Closest game</BlurReveal>);
    const el = screen.getByText("Closest game");
    expect(el).toHaveClass("motion-blur-reveal", "text-lg");
    expect(el).not.toHaveAttribute("style");
  });
});
