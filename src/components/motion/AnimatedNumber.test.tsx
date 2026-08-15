import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import AnimatedNumber from "./AnimatedNumber";

// See useTextScramble.test.ts: stub the provider rather than resetting modules,
// so the component keeps rendering against the one React instance.
const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

describe("AnimatedNumber", () => {
  it("ships the final value in the server HTML, never a zero", () => {
    const html = renderToStaticMarkup(<AnimatedNumber value={1234} />);
    expect(html).toContain("1234");
    expect(html).not.toMatch(/>\s*0\s*</);
  });

  it("applies the format function to the rendered value", () => {
    const html = renderToStaticMarkup(
      <AnimatedNumber value={1234} format={(n) => `${n} tests`} />,
    );
    expect(html).toContain("1234 tests");
  });

  it("never renders a fractional figure, even for a fractional input", () => {
    // The count-up interpolates, so mid-count values are floats. Formatting a
    // float with toLocaleString sprays decimals across the proof strip. The
    // component rounds before it formats, and this pins that at the seam.
    const html = renderToStaticMarkup(<AnimatedNumber value={1234.56} />);
    expect(html).toContain("1235");
    expect(html).not.toContain("1234.56");
  });

  it("shows the final value immediately under reduced motion", () => {
    mocks.reduced = true;

    render(<AnimatedNumber value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnimatedNumber value={99} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
