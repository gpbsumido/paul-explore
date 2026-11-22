import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "@/test/a11y";
import BlobBackground from "./BlobBackground";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

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
  });

  it("gives each layer two more points than the one below it", () => {
    const { container } = render(<BlobBackground seeds={[1, 2, 3]} />);
    const curves = [...container.querySelectorAll("path")].map(
      (path) => path.getAttribute("d")?.match(/C/g)?.length,
    );
    expect(curves).toEqual([8, 10, 12]);
  });

  it("cycles its colours across the layers", () => {
    const { container } = render(
      <BlobBackground seeds={[1, 2, 3]} colors={["red", "blue"]} />,
    );
    const firstStops = [...container.querySelectorAll("radialGradient")].map(
      (gradient) => gradient.querySelector("stop")?.getAttribute("stop-color"),
    );
    expect(firstStops).toEqual(["red", "blue", "red"]);
  });

  // A card's two seeds come from a hash and land on the same number about one
  // card in six. React then saw two children with one key and warned, and both
  // layers pointed at one gradient, so the second colour never showed.
  it("keeps two layers apart when their seeds are the same number", () => {
    const { container } = render(
      <BlobBackground seeds={[3, 3]} colors={["red", "blue"]} />,
    );
    const fills = [...container.querySelectorAll("path")].map((path) =>
      path.getAttribute("fill"),
    );
    const gradientIds = [...container.querySelectorAll("radialGradient")].map(
      (gradient) => gradient.id,
    );

    expect(new Set(gradientIds).size).toBe(2);
    expect(fills).toEqual(gradientIds.map((id) => `url(#${id})`));
  });

  it("gives two backgrounds on one page gradients of their own", () => {
    const { container } = render(
      <>
        <BlobBackground seeds={[3]} colors={["red"]} />
        <BlobBackground seeds={[3]} colors={["blue"]} />
      </>,
    );
    const gradientIds = [...container.querySelectorAll("radialGradient")].map(
      (gradient) => gradient.id,
    );

    expect(new Set(gradientIds).size).toBe(2);
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
