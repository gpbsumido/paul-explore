import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StarBorder from "./StarBorder";

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
});
