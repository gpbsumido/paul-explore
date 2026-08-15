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

  it("has no axe violations", async () => {
    const { container } = render(<GradientMesh />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
