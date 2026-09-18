import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SpotlightCard from "./SpotlightCard";

describe("SpotlightCard", () => {
  it("renders its children", () => {
    render(
      <SpotlightCard>
        <span>Nets @ Celtics</span>
      </SpotlightCard>,
    );
    expect(screen.getByText("Nets @ Celtics")).toBeInTheDocument();
  });

  it("tracks the pointer into CSS custom properties", () => {
    render(
      <SpotlightCard data-testid="card">
        <span>hover me</span>
      </SpotlightCard>,
    );
    const card = screen.getByTestId("card");
    fireEvent.pointerMove(card, { clientX: 40, clientY: 12 });
    expect(card.style.getPropertyValue("--spot-x")).toBe("40px");
    expect(card.style.getPropertyValue("--spot-y")).toBe("12px");
  });
});
