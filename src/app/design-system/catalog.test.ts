import { describe, it, expect } from "vitest";
import * as UI from "@/components/ui";
import {
  COMPONENTS,
  COLOR_SCALES,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  buildButtonSnippet,
  type ButtonPlaygroundState,
} from "./catalog";

describe("design system catalog integrity", () => {
  it("documents every primitive exported from the shared UI barrel", () => {
    const exported = Object.keys(UI).sort();
    const documented = COMPONENTS.map((c) => c.importName).sort();
    expect(documented).toEqual(exported);
  });

  it("gives every component a unique id", () => {
    const ids = COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every 'used on' link at a real in-app route", () => {
    for (const component of COMPONENTS) {
      expect(component.usedOn.length).toBeGreaterThan(0);
      for (const link of component.usedOn) {
        expect(link.label.length).toBeGreaterThan(0);
        expect(link.href.startsWith("/")).toBe(true);
      }
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
    expect(RADIUS_TOKENS.every((t) => t.var.startsWith("--radius-"))).toBe(true);
    expect(SHADOW_TOKENS.every((t) => t.var.startsWith("--shadow-"))).toBe(true);
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
    expect(
      buildButtonSnippet({ ...base, variant: "danger", size: "lg" }),
    ).toBe('<Button variant="danger" size="lg">Click me</Button>');
  });

  it("renders boolean props as bare attributes when enabled", () => {
    expect(
      buildButtonSnippet({ ...base, loading: true, disabled: true }),
    ).toBe("<Button loading disabled>Click me</Button>");
  });

  it("uses the current label as the button text", () => {
    expect(buildButtonSnippet({ ...base, label: "Save changes" })).toBe(
      "<Button>Save changes</Button>",
    );
  });
});
