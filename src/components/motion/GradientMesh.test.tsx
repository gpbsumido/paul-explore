import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "@/test/a11y";
import GradientMesh from "./GradientMesh";

describe("GradientMesh", () => {
  it("is decorative and hidden from assistive tech", () => {
    const { container } = render(<GradientMesh />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("builds its mesh from the colours it is given", () => {
    const { container } = render(
      <GradientMesh colors={["var(--color-primary-500)"]} />,
    );
    expect(container.innerHTML).toContain("--color-primary-500");
  });

  it("fills the other blooms from the first colour when only one is given", () => {
    const { container } = render(<GradientMesh colors={["red"]} />);
    const mesh = container.firstElementChild as HTMLElement;
    expect(mesh.style.getPropertyValue("--mesh-a")).toBe("red");
    expect(mesh.style.getPropertyValue("--mesh-b")).toBe("red");
    expect(mesh.style.getPropertyValue("--mesh-c")).toBe("red");
  });

  it("assigns each bloom its own colour when three are given", () => {
    const { container } = render(<GradientMesh colors={["red", "green", "blue"]} />);
    const mesh = container.firstElementChild as HTMLElement;
    expect([
      mesh.style.getPropertyValue("--mesh-a"),
      mesh.style.getPropertyValue("--mesh-b"),
      mesh.style.getPropertyValue("--mesh-c"),
    ]).toEqual(["red", "green", "blue"]);
  });

  it("drifts at the speed it is given, and a slow default otherwise", () => {
    const { container, rerender } = render(<GradientMesh speedMs={5000} />);
    const mesh = () => container.firstElementChild as HTMLElement;
    expect(mesh().style.getPropertyValue("--mesh-duration")).toBe("5000ms");
    rerender(<GradientMesh />);
    expect(mesh().style.getPropertyValue("--mesh-duration")).toBe("18000ms");
  });

  it("has no axe violations", async () => {
    const { container } = render(<GradientMesh />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
