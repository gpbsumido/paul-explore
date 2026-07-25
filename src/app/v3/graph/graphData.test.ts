import { describe, it, expect } from "vitest";
import { buildGraphData, buildLayeredLayout } from "./graphData";
import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";

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
    const featuresWithNotes = FEATURES.filter((f) => f.thoughtsHref);
    expect(bridges).toHaveLength(featuresWithNotes.length);
    for (const f of featuresWithNotes) {
      const slug = f.thoughtsHref!.replace(/^\/thoughts\//, "");
      const bridge = bridges.find((b) => b.target === `thought:${slug}`);
      expect(bridge, `bridge for ${f.title}`).toBeDefined();
    }
  });

  it("connects the root to the hub and to every category", () => {
    const rootEdges = data.edges.filter((e) => e.source === "root");
    const targets = rootEdges.map((e) => e.target);
    expect(targets).toContain("hub:features");
    expect(targets.some((t) => t.startsWith("cat:"))).toBe(true);
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

  it("reports a positive canvas size", () => {
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});
