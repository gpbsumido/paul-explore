import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ArrowUpRight, ArrowUp, ArrowRight, ArrowDownRight } from "./arrows";

// The design-system reset renders a bare svg as display:block, which dropped a
// trailing arrow onto its own line in inline-text contexts (nav, hero meta,
// footer). The icons override it to inline-block; this pins that so the arrows
// can't silently fall off the line again.
describe("arrow icons stay on the text line", () => {
  it.each([
    ["ArrowUpRight", <ArrowUpRight key="ur" size={13} />],
    ["ArrowUp", <ArrowUp key="u" size={13} />],
    ["ArrowRight", <ArrowRight key="r" size={13} />],
    ["ArrowDownRight", <ArrowDownRight key="dr" size={13} />],
  ])("%s renders display:inline-block", (_name, element) => {
    const { container } = render(element);
    const svg = container.querySelector("svg");
    expect(svg?.style.display).toBe("inline-block");
  });
});
