import { describe, it, expect } from "vitest";
import { buildCommandRegistry } from "../registry";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";

describe("buildCommandRegistry", () => {
  const registry = buildCommandRegistry();

  it("includes a Pages command for every feature", () => {
    for (const feature of FEATURES) {
      const command = registry.find((c) => c.href === feature.href);
      expect(command, `missing command for ${feature.title}`).toBeDefined();
      expect(command?.group).toBe("Pages");
    }
  });

  it("includes a Dev Notes command for every thought", () => {
    const devNotes = registry.filter((c) => c.group === "Dev Notes");
    for (const thought of THOUGHTS) {
      expect(
        devNotes.some((c) => c.href === thought.href),
        `missing dev note for ${thought.title}`,
      ).toBe(true);
    }
  });

  it("includes the theme toggle action", () => {
    const themeCommand = registry.find((c) => c.actionId === "toggle-theme");
    expect(themeCommand).toBeDefined();
    expect(themeCommand?.group).toBe("Actions");
  });

  it("includes core static pages not covered by features", () => {
    const hrefs = registry.map((c) => c.href);
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/thoughts");
    expect(hrefs).toContain("/settings");
    expect(hrefs).toContain("/resume");
  });

  it("marks external feature links", () => {
    const external = registry.filter((c) => c.external);
    expect(external.length).toBeGreaterThan(0);
    expect(external.every((c) => c.href?.startsWith("http"))).toBe(true);
  });

  it("gives every command a unique id", () => {
    const ids = registry.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives navigation commands keywords for fuzzy fallback", () => {
    const calendar = registry.find((c) => c.href === "/calendar");
    expect(calendar?.keywords.length).toBeGreaterThan(0);
  });
});
