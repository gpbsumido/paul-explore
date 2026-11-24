import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StarBorder from "./StarBorder";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

describe("StarBorder", () => {
  it("renders its children inside the bordered content", () => {
    render(
      <StarBorder>
        <p>Biggest underdog</p>
      </StarBorder>,
    );
    expect(screen.getByText("Biggest underdog")).toBeInTheDocument();
  });

  it("draws the spinning ring", () => {
    const { container } = render(
      <StarBorder>
        <p>hi</p>
      </StarBorder>,
    );
    expect(container.querySelector(".motion-star-border__ring")).not.toBeNull();
  });

  it("sweeps while motion is allowed and holds a static frame under reduced motion", () => {
    const { container, rerender } = render(
      <StarBorder className="p-2">
        <p>hi</p>
      </StarBorder>,
    );
    const frame = () => container.firstElementChild;
    expect(frame()).toHaveClass("motion-star-border", "p-2");
    expect(frame()).not.toHaveClass("motion-star-border--static");

    mocks.reduced = true;
    rerender(
      <StarBorder className="p-2">
        <p>hi</p>
      </StarBorder>,
    );
    expect(frame()).toHaveClass("motion-star-border--static");
  });

  it("keeps the ring decorative", () => {
    const { container } = render(
      <StarBorder>
        <p>hi</p>
      </StarBorder>,
    );
    expect(container.querySelector(".motion-star-border__ring")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
