import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import TextScramble from "./TextScramble";

const mocks = vi.hoisted(() => ({ inView: false }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useInView: () => mocks.inView,
}));

beforeEach(() => {
  mocks.inView = false;
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("TextScramble", () => {
  it("churns on mount, then settles on the source text", async () => {
    render(<TextScramble text="Ember" trigger="mount" speedMs={100} />);

    await advance(150);
    expect(screen.getByText("EAAAA")).toBeInTheDocument();

    await advance(1000);
    expect(screen.getByText("Ember")).toBeInTheDocument();
  });

  it("waits until it is on screen when the trigger is inView", async () => {
    const { container, rerender } = render(
      <TextScramble text="Ember" trigger="inView" speedMs={100} />,
    );
    await advance(300);
    expect(container.textContent).toBe("Ember");

    mocks.inView = true;
    rerender(<TextScramble text="Ember" trigger="inView" speedMs={100} />);
    await advance(150);
    expect(container.textContent).toBe("EAAAA");
  });

  it("renders the element it is asked for, with the caller's class", () => {
    const { container } = render(
      <TextScramble text="Ember" as="h2" className="text-xl" trigger="mount" />,
    );
    expect(container.firstElementChild?.tagName).toBe("H2");
    expect(container.firstElementChild).toHaveClass("text-xl");
  });

  it("ships the settled text in the server HTML", () => {
    const html = renderToStaticMarkup(
      <TextScramble text="Verdigris" trigger="mount" />,
    );
    expect(html).toContain("Verdigris");
  });

  it("shows the full settled text before it is in view, with no ARIA of its own", () => {
    render(<TextScramble text="Verdigris" trigger="inView" speedMs={1} />);
    const el = screen.getByText("Verdigris");
    expect(el).not.toHaveAttribute("aria-label");
    expect(el).not.toHaveAttribute("role");
  });

  it("waits for the screen by default rather than churning on mount", async () => {
    const { container } = render(<TextScramble text="Ember" speedMs={100} />);
    await advance(300);
    expect(container.textContent).toBe("Ember");
  });

  it("has no axe violations", async () => {
    // axe polls on real timers, so it cannot run under the fake clock.
    vi.useRealTimers();
    const { container } = render(
      <TextScramble text="Verdigris" trigger="mount" speedMs={1} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
