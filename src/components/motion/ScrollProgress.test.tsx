import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import ScrollProgress from "./ScrollProgress";

describe("ScrollProgress", () => {
  it("is hidden from assistive tech because it duplicates the scrollbar", () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("is not announced as a progressbar", () => {
    render(<ScrollProgress />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ScrollProgress />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
