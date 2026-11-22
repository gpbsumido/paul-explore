import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
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

  it("has no axe violations", async () => {
    const { container } = render(<StackStrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
