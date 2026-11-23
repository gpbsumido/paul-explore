import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import AnimatedNumber from "./AnimatedNumber";

// See useTextScramble.test.ts: stub the provider rather than resetting modules,
// so the component keeps rendering against the one React instance.
const mocks = vi.hoisted(() => ({ reduced: false, inView: true }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reduced,
}));

// jsdom has no layout, so whether the number is on screen is the test's call.
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useInView: () => mocks.inView,
}));

beforeEach(() => {
  mocks.reduced = false;
  mocks.inView = true;
});

afterEach(() => vi.useRealTimers());

describe("AnimatedNumber", () => {
  it("ships the final value in the server HTML, never a zero", () => {
    const html = renderToStaticMarkup(<AnimatedNumber value={1234} />);
    expect(html).toContain("1234");
    expect(html).not.toMatch(/>\s*0\s*</);
  });

  it("groups thousands when the comma format is asked for", () => {
    const html = renderToStaticMarkup(
      <AnimatedNumber value={1234} format="comma" />,
    );
    expect(html).toContain("1,234");
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

  it("counts up from zero once it scrolls into view, and not before", async () => {
    vi.useFakeTimers();
    mocks.inView = false;
    const { rerender } = render(<AnimatedNumber value={100} durationMs={400} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText("0")).toBeInTheDocument();

    mocks.inView = true;
    rerender(<AnimatedNumber value={100} durationMs={400} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    const midCount = Number(screen.getByText(/^\d+$/).textContent);
    expect(midCount).toBeGreaterThan(0);
    expect(midCount).toBeLessThan(100);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("takes as long as it was told to", async () => {
    vi.useFakeTimers();
    render(<AnimatedNumber value={100} durationMs={2000} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnimatedNumber value={99} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
