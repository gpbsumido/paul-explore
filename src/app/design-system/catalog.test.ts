import { describe, it, expect } from "vitest";
import * as Pkg from "@paul-portfolio/react";
import {
  COMPONENTS,
  COLOR_SCALES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  TYPOGRAPHY_TOKENS,
  buildButtonSnippet,
  type ButtonPlaygroundState,
} from "./catalog";

/** Package exports that aren't renderable primitives, so the gallery skips them. */
const NON_COMPONENT_EXPORTS = [
  "cx",
  // Not renderable primitives: the geometry core the charts are computed from,
  // and the motion-preference hook they and the effects share.
  "chartGeometry",
  "usePrefersReducedMotion",
];

describe("design system catalog integrity", () => {
  it("documents every component shipped by @paul-portfolio/react", () => {
    const exported = Object.keys(Pkg)
      .filter((name) => !NON_COMPONENT_EXPORTS.includes(name))
      .sort();
    const documented = COMPONENTS.map((c) => c.importName).sort();
    expect(documented).toEqual(exported);
  });

  it("gives every component a unique id", () => {
    const ids = COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every 'used on' link at an in-app route", () => {
    for (const component of COMPONENTS) {
      for (const link of component.usedOn) {
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("documents provenance for every component — an in-app route or an elsewhere note", () => {
    for (const component of COMPONENTS) {
      const hasProvenance =
        component.usedOn.length > 0 || Boolean(component.elsewhere);
      expect(hasProvenance).toBe(true);
    }
  });

  it("describes at least one accessibility guarantee per component", () => {
    for (const component of COMPONENTS) {
      expect(component.a11y.length).toBeGreaterThan(0);
      expect(component.usage.length).toBeGreaterThan(0);
    }
  });
});

describe("token scales", () => {
  it("exposes color ramps as css custom property names", () => {
    expect(COLOR_SCALES.length).toBeGreaterThan(0);
    for (const scale of COLOR_SCALES) {
      expect(scale.steps.length).toBeGreaterThan(0);
      for (const step of scale.steps) {
        expect(step.startsWith("--color-")).toBe(true);
      }
    }
  });

  it("exposes radius and shadow tokens", () => {
    expect(RADIUS_TOKENS.every((t) => t.var.startsWith("--radius-"))).toBe(
      true,
    );
    expect(SHADOW_TOKENS.every((t) => t.var.startsWith("--shadow-"))).toBe(
      true,
    );
  });

  it("carries the full shadow ramp through 2xl", () => {
    expect(SHADOW_TOKENS.map((t) => t.label)).toContain("2xl");
  });

  it("exposes a type scale from the font-size tokens", () => {
    expect(TYPOGRAPHY_TOKENS.length).toBeGreaterThan(0);
    expect(TYPOGRAPHY_TOKENS.every((t) => t.var.startsWith("--text-"))).toBe(
      true,
    );
  });
});

describe("buildButtonSnippet", () => {
  const base: ButtonPlaygroundState = {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    label: "Click me",
  };

  it("omits props that match the component defaults", () => {
    expect(buildButtonSnippet(base)).toBe("<Button>Click me</Button>");
  });

  it("includes only the props that differ from the defaults", () => {
    expect(buildButtonSnippet({ ...base, variant: "danger", size: "lg" })).toBe(
      '<Button variant="danger" size="lg">Click me</Button>',
    );
  });

  it("renders boolean props as bare attributes when enabled", () => {
    expect(buildButtonSnippet({ ...base, loading: true, disabled: true })).toBe(
      "<Button loading disabled>Click me</Button>",
    );
  });

  it("uses the current label as the button text", () => {
    expect(buildButtonSnippet({ ...base, label: "Save changes" })).toBe(
      "<Button>Save changes</Button>",
    );
  });
});
