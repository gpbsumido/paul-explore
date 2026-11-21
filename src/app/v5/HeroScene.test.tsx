import { describe, it, expect, vi, afterEach } from "vitest";
import { render as rtlRender, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";

const prefersReducedMotion = vi.hoisted(() => ({ value: false }));

vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => prefersReducedMotion.value,
}));

// The real canvas pulls in three.js. These tests are about whether the scene
// is chosen, so a marker that echoes the theme it was given is enough.
vi.mock("./HeroKnotCanvas", () => ({
  default: ({ dark }: { dark: boolean }) => (
    <div data-testid="hero-knot" data-dark={String(dark)} />
  ),
}));

// IntersectionObserver is not in jsdom; the lazy mount is not what is under test.
vi.mock("@/app/landing/models/ModelLazyMount", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import HeroScene from "./HeroScene";

afterEach(() => {
  window.localStorage.clear();
  prefersReducedMotion.value = false;
  vi.restoreAllMocks();
});

/**
 * Answers the scene's WebGL probe. The scene decides after first paint, so a
 * test waits on the probe itself rather than on the clock.
 */
const probeWebGL = (available: boolean | "webgl1 only") =>
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    // The scene only checks that something truthy came back, never what it is.
    ((kind: string) =>
      available === true || (available === "webgl1 only" && kind === "webgl")
        ? {}
        : null) as unknown as HTMLCanvasElement["getContext"],
  );

/** The scene reads the theme now, so it needs the provider around it. */
const render = (ui: React.ReactElement) =>
  rtlRender(<ThemeProvider>{ui}</ThemeProvider>);

/**
 * jsdom's canvas has no WebGL context, which is the same signal a real browser
 * gives on a machine that cannot run the scene. That makes the fallback the
 * default path here rather than a special case worth staging.
 */
describe("HeroScene", () => {
  it("falls back to the static shape when there is no WebGL context", async () => {
    const probe = probeWebGL(false);
    const { container } = render(<HeroScene />);
    await waitFor(() => expect(probe).toHaveBeenCalled());
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-knot")).not.toBeInTheDocument();
  });

  it("swaps the static shape for the 3D scene once WebGL is confirmed", async () => {
    probeWebGL(true);
    const { container } = render(<HeroScene />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(await screen.findByTestId("hero-knot")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("still runs the 3D scene on a device that only offers WebGL 1", async () => {
    probeWebGL("webgl1 only");
    render(<HeroScene />);
    expect(await screen.findByTestId("hero-knot")).toBeInTheDocument();
  });

  it.each([
    ["light", "false"],
    ["dark", "true"],
  ])("hands the canvas the %s theme", async (theme, expectedDark) => {
    window.localStorage.setItem("theme-preference", theme);
    probeWebGL(true);
    render(<HeroScene />);
    expect((await screen.findByTestId("hero-knot")).dataset.dark).toBe(
      expectedDark,
    );
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

  it("keeps the static shape when the reader has asked for reduced motion, even with WebGL", async () => {
    prefersReducedMotion.value = true;
    const probe = probeWebGL(true);
    const { container } = render(<HeroScene />);
    await waitFor(() => expect(probe).toHaveBeenCalled());
    expect(screen.queryByTestId("hero-knot")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<HeroScene />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
