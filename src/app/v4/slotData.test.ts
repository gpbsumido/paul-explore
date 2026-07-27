import { describe, it, expect } from "vitest";
import { buildSlots, wrapIndex } from "./slotData";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";
import { DEPRECATED_GROUP } from "@/app/_shared/thoughtCategories";

describe("buildSlots", () => {
  const categories = buildSlots();
  const apps = categories[0];
  const allOptions = categories.flatMap((c) => c.options);

  it("puts Apps first with every feature as an option, in order", () => {
    expect(apps.label).toBe("Apps");
    expect(apps.options).toHaveLength(FEATURES.length);
    expect(apps.options.map((o) => o.label)).toEqual(
      FEATURES.map((f) => f.title),
    );
  });

  it("bridges a feature with an active write-up to exactly that write-up", () => {
    // operator points at /thoughts/operator-dashboard, which is active.
    const operator = apps.options.find((o) => o.id === "feat:operator");
    expect(operator).toBeDefined();
    expect(operator!.thoughts).toHaveLength(1);
    expect(operator!.thoughts[0].href).toBe("/thoughts/operator-dashboard");
  });

  it("gives a feature without a write-up an empty reel 3", () => {
    // work-portfolio's feature entry has no thoughtsHref.
    const wp = apps.options.find((o) => o.id === "feat:work-portfolio");
    expect(wp).toBeDefined();
    expect(wp!.thoughts).toEqual([]);
  });

  it("drops the bridge when a feature's write-up is deprecated", () => {
    // No feature currently points at a deprecated write-up, so this assertion
    // is vacuous today. It's kept so the bridge rule is enforced the moment a
    // feature's notes get deprecated.
    const deprecatedHrefs = new Set(
      THOUGHTS.filter((t) => t.deprecated).map((t) => t.href),
    );
    const stale = FEATURES.filter(
      (f) => f.thoughtsHref && deprecatedHrefs.has(f.thoughtsHref),
    );
    for (const feature of stale) {
      const option = apps.options.find((o) => o.id === `feat:${feature.id}`);
      expect(option?.thoughts).toEqual([]);
    }
  });

  it("has a Résumé category with a single option linking to /resume", () => {
    const resume = categories.find((c) => c.label === "Résumé");
    expect(resume).toBeDefined();
    expect(resume!.options).toHaveLength(1);
    expect(resume!.options[0].href).toBe("/resume");
  });

  it("keeps deprecated write-ups reachable through a Deprecated category", () => {
    expect(THOUGHTS.some((t) => t.deprecated)).toBe(true);
    const deprecated = categories.find((c) => c.label === DEPRECATED_GROUP);
    expect(deprecated).toBeDefined();
    expect(deprecated!.options.length).toBeGreaterThan(0);
    for (const option of deprecated!.options) {
      expect(option.thoughts).toHaveLength(1);
      expect(option.thoughts[0].deprecated).toBe(true);
    }
  });

  it("keeps standalone write-ups (no feature bridge) reachable via their category", () => {
    const bridged = new Set(
      FEATURES.map((f) => f.thoughtsHref).filter((h) => h !== undefined),
    );
    const standalone = THOUGHTS.find(
      (t) => !t.deprecated && !bridged.has(t.href),
    );
    expect(standalone).toBeDefined();
    const writingCategories = categories.filter((c) => c.id.startsWith("cat:"));
    const holder = writingCategories.find((c) =>
      c.options.some((o) => o.href === standalone!.href),
    );
    expect(holder).toBeDefined();
  });

  it("gives every option a non-empty href, external exactly for http links", () => {
    expect(allOptions.length).toBeGreaterThan(0);
    for (const option of allOptions) {
      expect(option.href.length, option.id).toBeGreaterThan(0);
      expect(Boolean(option.external), option.id).toBe(
        option.href.startsWith("http"),
      );
    }
  });
});

describe("wrapIndex", () => {
  it("wraps negative and overflowing indices around the reel", () => {
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(4, 3)).toBe(1);
    expect(wrapIndex(1, 3)).toBe(1);
  });

  it("returns 0 for an empty reel", () => {
    expect(wrapIndex(0, 0)).toBe(0);
    expect(wrapIndex(5, 0)).toBe(0);
  });
});
