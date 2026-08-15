import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "@/test/a11y";
import BlobBackground from "./BlobBackground";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

describe("BlobBackground", () => {
  it("drifts its layers ambiently, each on its own clock", () => {
    mocks.reduced = false;
    const { container } = render(<BlobBackground seeds={[1, 2]} />);
    const paths = [...container.querySelectorAll("path")];
    for (const path of paths) {
      expect(path.classList.contains("blob-drift")).toBe(true);
    }
    const durations = paths.map((p) => p.style.animationDuration);
    expect(new Set(durations).size).toBe(paths.length);
  });

  it("holds still under reduced motion", () => {
    mocks.reduced = true;
    const { container } = render(<BlobBackground seeds={[1, 2]} />);
    expect(container.querySelector(".blob-drift")).not.toBeInTheDocument();
    mocks.reduced = false;
  });

  it("renders one path per seed", () => {
    const { container } = render(<BlobBackground seeds={[1, 2, 3]} />);
    expect(container.querySelectorAll("path")).toHaveLength(3);
  });

  it("is decorative and hidden from assistive tech", () => {
    const { container } = render(<BlobBackground seeds={[1, 2]} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the same shapes for the same seeds across renders", () => {
    const first = render(<BlobBackground seeds={[4]} />);
    const firstPath = first.container.querySelector("path")?.getAttribute("d");
    first.unmount();

    const second = render(<BlobBackground seeds={[4]} />);
    const secondPath = second.container
      .querySelector("path")
      ?.getAttribute("d");

    expect(firstPath).toBeTruthy();
    expect(secondPath).toBe(firstPath);
  });

  it("renders as SVG so it needs no canvas", () => {
    const { container } = render(<BlobBackground seeds={[1]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<BlobBackground seeds={[1, 2]} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
