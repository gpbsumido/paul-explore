import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "@/test/a11y";
import BlobBackground from "./BlobBackground";

describe("BlobBackground", () => {
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
