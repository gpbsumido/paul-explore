import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlurReveal from "./BlurReveal";

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
});
