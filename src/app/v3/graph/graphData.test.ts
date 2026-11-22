import { describe, it, expect } from "vitest";
import { buildGraphData, buildLayeredLayout } from "./graphData";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";
import { isExternalHref } from "@/lib/isExternalHref";

describe("buildGraphData", () => {
  const data = buildGraphData();
  const byId = new Map(data.nodes.map((n) => [n.id, n]));

  it("has exactly one root and one features hub", () => {
    expect(data.nodes.filter((n) => n.kind === "root")).toHaveLength(1);
    expect(data.nodes.filter((n) => n.kind === "hub")).toHaveLength(1);
  });

  it("has a node for every feature and every non-deprecated write-up", () => {
    expect(data.nodes.filter((n) => n.kind === "feature")).toHaveLength(
      FEATURES.length,
    );
    expect(data.nodes.filter((n) => n.kind === "thought")).toHaveLength(
      THOUGHTS.filter((t) => !t.deprecated).length,
    );
  });

  it("keeps deprecated write-ups out of the graph entirely", () => {
    const deprecatedSlugs = THOUGHTS.filter((t) => t.deprecated).map((t) =>
      t.href.replace(/^\/thoughts\//, ""),
    );
    expect(deprecatedSlugs.length).toBeGreaterThan(0);
    for (const slug of deprecatedSlugs) {
      expect(data.nodes.some((n) => n.id === `thought:${slug}`)).toBe(false);
    }
  });

  it("gives every node a unique id", () => {
    const ids = data.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references existing nodes from edges", () => {
    for (const e of data.edges) {
      expect(byId.has(e.source)).toBe(true);
      expect(byId.has(e.target)).toBe(true);
    }
  });

  it("bridges a feature to its own write-up for every thoughtsHref", () => {
    const bridges = data.edges.filter((e) => e.bridge);
    // A bridge only reaches a non-deprecated write-up, so a feature linking to a
    // deprecated one (discover -> v5-redesign) has no bridge.
    const deprecatedHrefs = new Set(
      THOUGHTS.filter((t) => t.deprecated).map((t) => t.href),
    );
    const featuresWithLiveNotes = FEATURES.filter(
      (f) => f.thoughtsHref && !deprecatedHrefs.has(f.thoughtsHref),
    );
    expect(bridges).toHaveLength(featuresWithLiveNotes.length);
    for (const f of featuresWithLiveNotes) {
      const slug = f.thoughtsHref!.replace(/^\/thoughts\//, "");
      const bridge = bridges.find((b) => b.target === `thought:${slug}`);
      expect(bridge, `bridge for ${f.title}`).toBeDefined();
    }
  });

  it("connects the root to the hub, the résumé and every category", () => {
    const rootTargets = data.edges.filter((e) => e.source === "root").map((e) => e.target);
    const categoryIds = data.nodes
      .filter((n) => n.kind === "category" && n.id.startsWith("cat:"))
      .map((n) => n.id);

    expect(categoryIds.length).toBeGreaterThan(0);
    expect(rootTargets).toContain("hub:features");
    expect(rootTargets).toContain("resume");
    for (const id of categoryIds) {
      expect(rootTargets, id).toContain(id);
    }
  });

  it("hangs every feature off the Apps hub and every write-up off its own category", () => {
    for (const node of data.nodes.filter((n) => n.kind === "feature")) {
      const parents = data.edges.filter((e) => e.target === node.id && !e.bridge);
      expect(parents.map((e) => e.source), node.label).toEqual(["hub:features"]);
    }
    for (const node of data.nodes.filter((n) => n.kind === "thought")) {
      const parents = data.edges.filter((e) => e.target === node.id && !e.bridge);
      expect(parents, node.label).toHaveLength(1);
      expect(byId.get(parents[0].source)?.kind, node.label).toBe("category");
    }
  });

  it("sends each feature node to its own route, in a new tab only when it leaves the site", () => {
    for (const feature of FEATURES) {
      const node = byId.get(`feat:${feature.id}`);
      expect(node?.href, feature.title).toBe(feature.href);
      expect(node?.external, feature.title).toBe(isExternalHref(feature.href));
    }
    expect(data.nodes.some((n) => n.external)).toBe(true);
  });

  it("colours a write-up like the category it sits in, so each cluster reads as one group", () => {
    for (const node of data.nodes.filter((n) => n.kind === "thought")) {
      const parent = data.edges.find((e) => e.target === node.id && !e.bridge)!;
      expect(node.color, node.label).toBe(byId.get(parent.source)?.color);
    }
  });

  it("counts the write-ups in each category's blurb", () => {
    for (const category of data.nodes.filter((n) => n.id.startsWith("cat:"))) {
      const children = data.edges.filter((e) => e.source === category.id).length;
      expect(category.blurb, category.label).toBe(`${children} write-ups`);
    }
  });

  it("deep-links every thoughts category node to its section on the index, not the top", () => {
    // Scope to the real thoughts categories (cat:* ids). The résumé node reuses
    // the "category" kind for its styling but links to its own page, not a
    // /thoughts section, so it is intentionally excluded here.
    const categories = data.nodes.filter(
      (n) => n.kind === "category" && n.id.startsWith("cat:"),
    );
    expect(categories.length).toBeGreaterThan(0);
    for (const c of categories) {
      expect(c.href, c.label).toMatch(/^\/thoughts#[a-z0-9-]+$/);
      expect(c.href, c.label).not.toBe("/thoughts");
    }
  });
});

describe("buildLayeredLayout", () => {
  const data = buildGraphData();
  const layout = buildLayeredLayout(data);

  it("positions every node", () => {
    for (const n of data.nodes) {
      const pos = layout.positions.get(n.id);
      expect(pos, n.id).toBeDefined();
      expect(Number.isFinite(pos!.x)).toBe(true);
      expect(Number.isFinite(pos!.y)).toBe(true);
    }
  });

  it("puts the root above its children", () => {
    const root = layout.positions.get("root")!;
    const hub = layout.positions.get("hub:features")!;
    expect(root.y).toBeLessThan(hub.y);
  });

  it("reports a canvas big enough to hold every node", () => {
    for (const [id, pos] of layout.positions) {
      expect(pos.x, id).toBeGreaterThan(0);
      expect(pos.x, id).toBeLessThan(layout.width);
      expect(pos.y, id).toBeGreaterThan(0);
      expect(pos.y, id).toBeLessThan(layout.height);
    }
  });

  it("gives every node its own spot", () => {
    const spots = [...layout.positions.values()].map((p) => `${p.x},${p.y}`);
    expect(new Set(spots).size).toBe(spots.length);
  });

  it("stacks each group's items in a column directly under its header", () => {
    const groups = data.edges.filter((e) => e.source === "root").map((e) => e.target);
    for (const groupId of groups) {
      const header = layout.positions.get(groupId)!;
      const kids = data.edges
        .filter((e) => e.source === groupId && !e.bridge)
        .map((e) => layout.positions.get(e.target)!);
      kids.forEach((kid, index) => {
        expect(kid.x, groupId).toBe(header.x);
        expect(kid.y, groupId).toBeGreaterThan(index === 0 ? header.y : kids[index - 1].y);
      });
    }
  });

  it("centres the root over its columns", () => {
    const columnXs = data.edges
      .filter((e) => e.source === "root")
      .map((e) => layout.positions.get(e.target)!.x);
    const root = layout.positions.get("root")!;
    expect(root.x).toBeCloseTo((Math.min(...columnXs) + Math.max(...columnXs)) / 2, 5);
  });
});
