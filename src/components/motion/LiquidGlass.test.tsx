import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LiquidGlass from "./LiquidGlass";

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
});
