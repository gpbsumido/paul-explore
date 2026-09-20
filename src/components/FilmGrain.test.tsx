import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import FilmGrain from "./FilmGrain";

describe("FilmGrain", () => {
  it("renders a decorative overlay that is out of the a11y tree", () => {
    const { container } = render(<FilmGrain />);
    const el = container.firstElementChild as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el?.getAttribute("aria-hidden")).toBe("true");
    expect(el?.className).toContain("film-grain");
  });

  it("never intercepts pointer events", () => {
    // The grain sits over the whole viewport; it must not block clicks. The
    // class carries pointer-events:none, but the element must also not be
    // focusable or land in the tab order.
    const { container } = render(<FilmGrain />);
    const el = container.firstElementChild as HTMLElement | null;
    expect(el?.getAttribute("tabindex")).toBeNull();
  });
});
