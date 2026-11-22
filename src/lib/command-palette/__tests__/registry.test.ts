import { describe, it, expect } from "vitest";
import { buildCommandRegistry } from "../registry";
import type { Command } from "../types";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";

describe("buildCommandRegistry", () => {
  const registry = buildCommandRegistry();
  const hrefOf = (c: Command) => (c.kind === "link" ? c.href : undefined);
  const isThemeToggle = (c: Command) => c.kind === "action" && c.action === "toggle-theme";

  it("includes a Pages command for every feature", () => {
    for (const feature of FEATURES) {
      const command = registry.find((c) => hrefOf(c) === feature.href);
      expect(command, `missing command for ${feature.title}`).toBeDefined();
      expect(command?.group).toBe("Pages");
    }
  });

  it("includes a Dev Notes command for every thought", () => {
    const devNotes = registry.filter((c) => c.group === "Dev Notes");
    for (const thought of THOUGHTS) {
      expect(
        devNotes.some((c) => hrefOf(c) === thought.href),
        `missing dev note for ${thought.title}`,
      ).toBe(true);
    }
  });

  it("includes the theme toggle action", () => {
    const themeCommand = registry.find(isThemeToggle);
    expect(themeCommand).toBeDefined();
    expect(themeCommand?.group).toBe("Actions");
  });

  it("includes core static pages not covered by features", () => {
    const hrefs = registry.map(hrefOf);
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/thoughts");
    expect(hrefs).toContain("/settings");
    expect(hrefs).toContain("/resume");
  });

  it("marks external feature links", () => {
    const external = registry.filter((c) => c.kind === "link" && c.external);
    expect(external.length).toBeGreaterThan(0);
    expect(external.every((c) => hrefOf(c)?.startsWith("http"))).toBe(true);
  });

  it("makes every command either a link with a target or a known action", () => {
    for (const command of registry) {
      if (command.kind === "link") {
        expect(command.href, command.id).toMatch(/^(\/|https:\/\/)/);
        expect(command.external, command.id).toBe(command.href.startsWith("http"));
      } else {
        expect(command.kind, command.id).toBe("action");
        expect(command.action, command.id).toBe("toggle-theme");
      }
    }
  });

  it("gives every command a unique id", () => {
    const ids = registry.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("seeds a feature's keywords from its title and id, lowercased and without repeats", () => {
    for (const feature of FEATURES) {
      const command = registry.find((c) => c.id === `feature-${feature.id}`);
      const expectedWords = `${feature.title} ${feature.id}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
      expect(command?.keywords, feature.title).toEqual(
        expect.arrayContaining(expectedWords),
      );
      expect(command?.keywords).toEqual([...new Set(command?.keywords)]);
    }
  });

  it("copies a dev note's title and preview onto its command", () => {
    const [thought] = THOUGHTS;
    const command = registry.find((c) => hrefOf(c) === thought.href);
    expect(command).toMatchObject({
      title: thought.title,
      subtitle: thought.preview,
      group: "Dev Notes",
    });
  });

  it("lists the core pages first and the theme action ahead of the dev notes", () => {
    expect(registry[0]).toMatchObject({ id: "page-home", href: "/" });
    const themeIndex = registry.findIndex(isThemeToggle);
    const firstNote = registry.findIndex((c) => c.group === "Dev Notes");
    expect(themeIndex).toBeLessThan(firstNote);
  });

  it("lets a query for 'dark' find the theme toggle through its keywords", () => {
    const toggle = registry.find(isThemeToggle);
    expect(toggle?.keywords).toEqual(
      expect.arrayContaining(["dark", "light", "appearance"]),
    );
  });
});
