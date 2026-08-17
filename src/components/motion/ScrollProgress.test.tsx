import { useRef } from "react";
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

  it("pins to the viewport when it tracks the window", () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstElementChild?.className).toContain("fixed");
  });

  it("sits inside its container when given one to track", () => {
    // The showcase needs a scoped one: a bar fixed to the viewport cannot
    // demonstrate itself inside a card, because the thing it responds to is
    // off-screen. Given a container it positions absolutely instead, so the
    // caller can place it against the box it is measuring.
    function Scoped() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref}>
          <ScrollProgress container={ref} />
        </div>
      );
    }
    const { container } = render(<Scoped />);
    // By its own attribute rather than by shape: the component marks its root
    // aria-hidden, and a `div > div` selector picks whichever wrapper happens
    // to be first.
    const bar = container.querySelector('[aria-hidden="true"]');
    expect(bar?.className).toContain("absolute");
    expect(bar?.className).not.toContain("fixed");
  });
});
