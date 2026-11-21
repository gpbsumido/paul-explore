import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ShineSweep from "./ShineSweep";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

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

  it("renders no sheen at all under reduced motion", () => {
    mocks.reduced = true;
    const { container } = render(
      <ShineSweep>
        <button type="button">Place bet</button>
      </ShineSweep>,
    );
    expect(container.querySelector(".motion-shine")).toBeNull();
    expect(screen.getByRole("button", { name: "Place bet" })).toBeInTheDocument();
  });

  it("renders the element it is asked for, with the caller's classes", () => {
    const { container } = render(
      <ShineSweep as="div" className="rounded-full">
        <span>Badge</span>
      </ShineSweep>,
    );
    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.firstElementChild).toHaveClass("rounded-full");
  });
});
