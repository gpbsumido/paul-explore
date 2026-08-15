import { describe, it, expect, vi } from "vitest";
import { render as rtlRender } from "@testing-library/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";

const prefersReducedMotion = vi.hoisted(() => ({ value: false }));

vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => prefersReducedMotion.value,
}));

import HeroScene from "./HeroScene";

/** The scene reads the theme now, so it needs the provider around it. */
const render = (ui: React.ReactElement) =>
  rtlRender(<ThemeProvider>{ui}</ThemeProvider>);

/**
 * jsdom's canvas has no WebGL context, which is the same signal a real browser
 * gives on a machine that cannot run the scene. That makes the fallback the
 * default path here rather than a special case worth staging.
 */
describe("HeroScene", () => {
  it("falls back to the static shape when there is no WebGL context", () => {
    const { container } = render(<HeroScene />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("draws that shape with the seeded generator, not a hand-typed path", () => {
    const { container } = render(<HeroScene />);
    const d = container.querySelector("path")?.getAttribute("d");
    expect(d).toMatch(/^M/);
    expect(d).toContain("C");
    expect(d?.endsWith("Z")).toBe(true);
  });

  it("draws the same shape twice, so hydration stays quiet", () => {
    const first = render(<HeroScene />);
    const firstPath = first.container.querySelector("path")?.getAttribute("d");
    first.unmount();
    const second = render(<HeroScene />);
    expect(second.container.querySelector("path")?.getAttribute("d")).toBe(
      firstPath,
    );
  });

  it("stays out of the accessibility tree, since it decorates the headline", () => {
    const { container } = render(<HeroScene />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back when the reader has asked for reduced motion", () => {
    prefersReducedMotion.value = true;
    const { container } = render(<HeroScene />);
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
    prefersReducedMotion.value = false;
  });

  it("has no axe violations", async () => {
    const { container } = render(<HeroScene />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
