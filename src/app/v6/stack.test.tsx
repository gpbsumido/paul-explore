import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import { STACK } from "./stack";
import StackStrip from "./StackStrip";

/** Every package the repo installs, runtime or dev. */
function installedPackages(): string[] {
  const manifest: { dependencies: object; devDependencies: object } = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  );
  return [...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)];
}

/**
 * Puts a spy where the rail's `scrollBy` will be looked up, before anything
 * renders, so a ticker started on mount can't slip past it. jsdom has no
 * `scrollBy` at all, so this adds one and `restore` takes it away again.
 */
function spyOnScrollBy() {
  const scrollBy = vi.fn<(options: ScrollToOptions) => void>();
  Object.defineProperty(HTMLElement.prototype, "scrollBy", { configurable: true, value: scrollBy });
  return { scrollBy, restore: () => Reflect.deleteProperty(HTMLElement.prototype, "scrollBy") };
}

/**
 * The strip sits under figures that are all imported rather than typed, so it
 * can't be the one place on the page that claims a tool the site doesn't use.
 * The labels are written by hand; the package behind each one is checked.
 */
describe("the v6 stack strip", () => {
  it.each(STACK)("$label is a package this repo depends on ($pkg)", ({ pkg }) => {
    expect(installedPackages()).toContain(pkg);
  });

  it("renders the stack as a named list, one item per entry", () => {
    render(<StackStrip />);
    const list = screen.getByRole("list", { name: "What this site is built on" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      STACK.map((entry) => entry.label),
    );
  });

  it("lets a keyboard reach the rail, since it scrolls sideways", () => {
    render(<StackStrip />);
    expect(screen.getByRole("list", { name: "What this site is built on" })).toHaveAttribute("tabindex", "0");
  });

  it("never moves the rail on its own, only when the visitor asks", async () => {
    vi.useFakeTimers();
    const { scrollBy, restore } = spyOnScrollBy();
    try {
      render(<StackStrip />);
      const list = screen.getByRole("list", { name: "What this site is built on" });

      act(() => vi.advanceTimersByTime(30_000));
      expect(scrollBy).not.toHaveBeenCalled();
      expect(list.scrollLeft).toBe(0);

      vi.useRealTimers();
      await userEvent.click(screen.getByRole("button", { name: "Scroll the tools forward" }));
      await userEvent.click(screen.getByRole("button", { name: "Scroll the tools back" }));
      expect(scrollBy.mock.calls.map(([options]) => Math.sign(options.left ?? 0))).toEqual([1, -1]);
    } finally {
      restore();
      vi.useRealTimers();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(<StackStrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
