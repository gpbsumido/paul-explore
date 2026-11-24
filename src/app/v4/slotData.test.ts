import { describe, it, expect, vi, afterEach } from "vitest";
import { buildSlots, shortestDelta, wrapIndex } from "./slotData";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";
import { DEPRECATED_GROUP } from "@/app/_shared/thoughtCategories";
import { isExternalHref } from "@/lib/isExternalHref";

describe("buildSlots", () => {
  const categories = buildSlots();
  const apps = categories[0];
  const allOptions = categories.flatMap((c) => c.options);

  it("puts Apps first with every feature as an option, in order", () => {
    const reeled = FEATURES.filter((f) => f.id !== "discover");
    expect(apps.label).toBe("Apps");
    expect(apps.options).toHaveLength(reeled.length);
    expect(apps.options.map((o) => o.label)).toEqual(
      reeled.map((f) => f.title),
    );
  });

  it("keeps the reels out of their own reel", () => {
    // Discover is the page the slot machine lives on. Landing on it mid-spin
    // offers to open where you already are, so it is a hub card but not a reel
    // option. Asserted against the real feature so this cannot pass by the
    // feature simply not existing.
    expect(FEATURES.some((f) => f.id === "discover")).toBe(true);
    expect(apps.options.some((o) => o.id === "feat:discover")).toBe(false);
  });

  it("bridges a feature with an active write-up to exactly that write-up", () => {
    // operator points at /thoughts/operator-dashboard, which is active.
    const operator = apps.options.find((o) => o.id === "feat:operator");
    expect(operator).toBeDefined();
    expect(operator!.thoughts).toHaveLength(1);
    expect(operator!.thoughts[0].href).toBe("/thoughts/operator-dashboard");
  });

  it("gives a feature without a write-up an empty reel 3", async () => {
    // The loop above checks nothing once every real feature has a write-up,
    // which is where the site is now. This builds the case it is about.
    vi.resetModules();
    vi.doMock("@/app/_shared/featureData.data", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/app/_shared/featureData.data")>();
      const withoutWriteUp = {
        ...actual.FEATURES[0],
        id: "no-write-up-fixture",
        thoughtsHref: undefined,
      };
      return { ...actual, FEATURES: [...actual.FEATURES, withoutWriteUp] };
    });
    const { buildSlots: buildWithFixture } = await import("./slotData");
    const option = buildWithFixture()[0].options.find(
      (o) => o.id === "feat:no-write-up-fixture",
    );
    vi.doUnmock("@/app/_shared/featureData.data");
    expect(option?.thoughts).toEqual([]);

    // And the real ones, for whichever features genuinely lack a write-up. This
    // used to point at work-portfolio, which then got one and broke a test that
    // was about the rule, not the feature.
    FEATURES.filter((f) => !f.thoughtsHref).forEach((feature) => {
      const real = apps.options.find((o) => o.id === `feat:${feature.id}`);
      expect(real?.thoughts).toEqual([]);
    });
  });

  it("has a Résumé category with a single option linking to /resume", () => {
    const resume = categories.find((c) => c.label === "Résumé");
    expect(resume).toBeDefined();
    expect(resume!.options).toHaveLength(1);
    expect(resume!.options[0].href).toBe("/resume");
  });

  it("gives a write-up-only category a single disabled placeholder, write-ups in reel 3", () => {
    // Build & Tooling has no app, just write-ups like deployment.
    const buildTooling = categories.find((c) => c.label === "Build & Tooling");
    expect(buildTooling).toBeDefined();
    expect(buildTooling!.options).toHaveLength(1);
    const placeholder = buildTooling!.options[0];
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.label).toBe("Write-up only");
    expect(placeholder.href).toBe("");
    expect(
      placeholder.thoughts.some((t) => t.href === "/thoughts/deployment"),
    ).toBe(true);
  });

  it("keeps deprecated write-ups reachable through a Deprecated category", () => {
    expect(THOUGHTS.some((t) => t.deprecated)).toBe(true);
    const deprecated = categories.find((c) => c.label === DEPRECATED_GROUP);
    expect(deprecated).toBeDefined();
    expect(deprecated!.options).toHaveLength(1);
    const placeholder = deprecated!.options[0];
    expect(placeholder.disabled).toBe(true);
    expect(placeholder.thoughts.length).toBeGreaterThan(0);
    for (const note of placeholder.thoughts) {
      expect(note.deprecated).toBe(true);
    }
  });

  it("keeps standalone write-ups (no feature bridge) reachable in a category's reel 3", () => {
    const bridged = new Set(
      FEATURES.map((f) => f.thoughtsHref).filter((h) => h !== undefined),
    );
    const standalone = THOUGHTS.find(
      (t) => !t.deprecated && !bridged.has(t.href),
    );
    expect(standalone).toBeDefined();
    const writingCategories = categories.filter((c) => c.id.startsWith("cat:"));
    const holder = writingCategories.find((c) =>
      c.options.some((o) =>
        o.thoughts.some((note) => note.href === standalone!.href),
      ),
    );
    expect(holder).toBeDefined();
  });

  it("gives every openable option a non-empty href, and every disabled one an empty href", () => {
    expect(allOptions.length).toBeGreaterThan(0);
    for (const option of allOptions) {
      if (option.disabled) {
        expect(option.href, option.id).toBe("");
        continue;
      }
      expect(option.href.length, option.id).toBeGreaterThan(0);
      expect(Boolean(option.external), option.id).toBe(isExternalHref(option.href));
    }
  });
});

describe("buildSlots with a known catalogue", () => {
  // The real catalogue is free to change, so the bridge rule is pinned against
  // a small fixed one instead of whatever features happen to exist today.
  afterEach(() => {
    vi.doUnmock("@/app/_shared/featureData.data");
    vi.resetModules();
  });

  const buildWithCatalogue = async () => {
    vi.resetModules();
    vi.doMock("@/app/_shared/featureData.data", () => ({
      FEATURES: [
        {
          id: "live",
          title: "Live",
          description: "d",
          href: "/live",
          color: "#111111",
          thoughtsHref: "/thoughts/live",
        },
        {
          id: "stale",
          title: "Stale",
          description: "d",
          href: "https://example.com/stale",
          color: "#222222",
          thoughtsHref: "/thoughts/old",
        },
        {
          id: "bare",
          title: "Bare",
          description: "d",
          href: "/bare",
          color: "#333333",
        },
      ],
      THOUGHTS: [
        { title: "Live note", href: "/thoughts/live", preview: "p", color: "#111111" },
        {
          title: "Design note",
          href: "/thoughts/design-detox",
          preview: "p",
          color: "#444444",
        },
        {
          title: "Old note",
          href: "/thoughts/old",
          preview: "p",
          color: "#222222",
          deprecated: true,
        },
      ],
    }));
    const { buildSlots: buildFromCatalogue } = await import("./slotData");
    return buildFromCatalogue();
  };

  it("bridges a feature to its active write-up only", async () => {
    const [apps] = await buildWithCatalogue();
    const byId = Object.fromEntries(apps.options.map((o) => [o.id, o]));
    expect(byId["feat:live"].thoughts.map((t) => t.href)).toEqual([
      "/thoughts/live",
    ]);
    expect(byId["feat:stale"].thoughts).toEqual([]);
    expect(byId["feat:bare"].thoughts).toEqual([]);
  });

  it("flags only an external feature as external", async () => {
    const [apps] = await buildWithCatalogue();
    const byId = Object.fromEntries(apps.options.map((o) => [o.id, o]));
    expect(byId["feat:stale"].external).toBe(true);
    expect(byId["feat:live"].external).toBe(false);
  });

  it("carries the deprecated flag onto reel-3 notes, and only on those", async () => {
    const categories = await buildWithCatalogue();
    const notes = categories
      .flatMap((c) => c.options)
      .flatMap((o) => o.thoughts);
    const old = notes.find((n) => n.href === "/thoughts/old");
    const live = notes.find((n) => n.href === "/thoughts/live");
    expect(old?.deprecated).toBe(true);
    expect(live).toBeDefined();
    expect(live).not.toHaveProperty("deprecated");
  });

  it("gives each write-up-only placeholder its own slugged id", async () => {
    const categories = await buildWithCatalogue();
    const ids = categories
      .filter((c) => c.id.startsWith("cat:"))
      .map((c) => c.options[0].id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^writeup-only:[a-z0-9-]+$/);
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

describe("shortestDelta", () => {
  it("takes the wrap when it is shorter", () => {
    expect(shortestDelta(0, 2, 3)).toBe(-1);
    expect(shortestDelta(2, 0, 3)).toBe(1);
    expect(shortestDelta(0, 3, 4)).toBe(-1);
  });

  it("takes the forward way on an exact tie", () => {
    // Halfway round a 4-reel is two steps either way; forward wins the tie.
    expect(shortestDelta(0, 2, 4)).toBe(2);
    expect(shortestDelta(1, 3, 4)).toBe(2);
  });

  it("steps forward when that is shortest, and stays put for same index", () => {
    expect(shortestDelta(0, 1, 5)).toBe(1);
    expect(shortestDelta(1, 1, 5)).toBe(0);
  });

  it("returns 0 for an empty reel", () => {
    expect(shortestDelta(0, 3, 0)).toBe(0);
  });
});
