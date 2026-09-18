import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ShineSweep from "./ShineSweep";

describe("ShineSweep", () => {
  it("renders its children", () => {
    render(
      <ShineSweep>
        <button type="button">Place bet</button>
      </ShineSweep>,
    );
    expect(screen.getByRole("button", { name: "Place bet" })).toBeInTheDocument();
  });

  it("lays a decorative sheen over the content", () => {
    const { container } = render(
      <ShineSweep>
        <button type="button">Place bet</button>
      </ShineSweep>,
    );
    const sheen = container.querySelector(".motion-shine");
    expect(sheen).not.toBeNull();
    expect(sheen?.getAttribute("aria-hidden")).toBe("true");
  });
});
