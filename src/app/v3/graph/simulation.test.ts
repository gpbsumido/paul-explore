import { describe, it, expect } from "vitest";
import {
  createSimState,
  stepSimulation,
  reheat,
  radialLayout,
  DEFAULT_PARAMS,
  type SimState,
} from "./simulation";
import { buildGraphData } from "./graphData";
import type { GraphData } from "./graphData";

const data: GraphData = buildGraphData();

/** A minimal two-node graph for isolating a single force. */
function pairState(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  edge = false,
): SimState {
  const mini: GraphData = {
    nodes: [
      { id: "a", kind: "feature", label: "A", color: "#000", radius: 12 },
      { id: "b", kind: "feature", label: "B", color: "#000", radius: 12 },
    ],
    edges: edge ? [{ source: "a", target: "b", rest: 100 }] : [],
  };
  const s = createSimState(mini);
  s.nodes[0].x = ax;
  s.nodes[0].y = ay;
  s.nodes[1].x = bx;
  s.nodes[1].y = by;
  s.nodes[0].pinned = false; // neither is the root here
  return s;
}

const dist = (s: SimState) =>
  Math.hypot(s.nodes[0].x - s.nodes[1].x, s.nodes[0].y - s.nodes[1].y);

describe("createSimState", () => {
  it("pins the root at the origin with no velocity", () => {
    const s = createSimState(data);
    const root = s.nodes[0];
    expect(root.pinned).toBe(true);
    expect(root.x).toBe(0);
    expect(root.y).toBe(0);
    expect(root.vx).toBe(0);
    expect(root.vy).toBe(0);
  });

  it("marks the root, hub and categories as labelled at rest", () => {
    const s = createSimState(data);
    for (const i of s.labeled) {
      expect(["root", "hub", "category"]).toContain(data.nodes[i].kind);
    }
    // every always-labelled node is in the set
    data.nodes.forEach((n, i) => {
      if (n.kind === "root" || n.kind === "hub" || n.kind === "category") {
        expect(s.labeled.has(i)).toBe(true);
      }
    });
  });

  it("allocates reusable force buffers sized to the node count", () => {
    const s = createSimState(data);
    expect(s.fx).toHaveLength(s.nodes.length);
    expect(s.fy).toHaveLength(s.nodes.length);
    expect(s.eff).toHaveLength(s.nodes.length);
  });

  it("is deterministic (same seed, same initial scatter)", () => {
    const a = createSimState(data);
    const b = createSimState(data);
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(
      b.nodes.map((n) => [n.x, n.y]),
    );
  });
});

describe("forces", () => {
  it("repulsion/collision pushes two overlapping nodes apart", () => {
    const s = pairState(0, 0, 3, 0); // nearly on top of each other
    const before = dist(s);
    stepSimulation(s, DEFAULT_PARAMS);
    expect(dist(s)).toBeGreaterThan(before);
  });

  it("a spring pulls two connected, far-apart nodes closer", () => {
    const s = pairState(-400, 0, 400, 0, true); // way beyond rest length (100)
    const before = dist(s);
    for (let i = 0; i < 20; i++) stepSimulation(s, DEFAULT_PARAMS);
    expect(dist(s)).toBeLessThan(before);
  });

  it("gravity pulls a lone node toward the origin", () => {
    const s = pairState(500, 500, 3000, 3000); // both far out
    const d0 = Math.hypot(s.nodes[0].x, s.nodes[0].y);
    for (let i = 0; i < 30; i++) stepSimulation(s, DEFAULT_PARAMS);
    expect(Math.hypot(s.nodes[0].x, s.nodes[0].y)).toBeLessThan(d0);
  });
});

describe("cooling and pinning", () => {
  it("decays alpha toward its floor and keeps positions finite", () => {
    const s = createSimState(data);
    for (let i = 0; i < 600; i++) stepSimulation(s, DEFAULT_PARAMS);
    expect(s.alpha).toBeLessThanOrEqual(DEFAULT_PARAMS.minAlpha + 1e-9);
    for (const n of s.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("never moves the pinned root", () => {
    const s = createSimState(data);
    for (let i = 0; i < 100; i++) stepSimulation(s, DEFAULT_PARAMS);
    expect(s.nodes[0].x).toBe(0);
    expect(s.nodes[0].y).toBe(0);
  });

  it("settled nodes are not stacked on the same point", () => {
    const s = createSimState(data);
    for (let i = 0; i < 500; i++) stepSimulation(s, DEFAULT_PARAMS);
    for (let i = 1; i < s.nodes.length; i++) {
      for (let j = i + 1; j < s.nodes.length; j++) {
        const d = Math.hypot(
          s.nodes[i].x - s.nodes[j].x,
          s.nodes[i].y - s.nodes[j].y,
        );
        expect(d).toBeGreaterThan(1);
      }
    }
  });

  it("reheat raises alpha", () => {
    const s = createSimState(data);
    s.alpha = 0.01;
    reheat(s, 0.5);
    expect(s.alpha).toBe(0.5);
    reheat(s, 0.2); // never lowers
    expect(s.alpha).toBe(0.5);
  });
});

describe("radialLayout", () => {
  it("centres the root and spreads the rest to distinct points", () => {
    const s = createSimState(data);
    radialLayout(s, data);
    expect(s.nodes[0].x).toBe(0);
    expect(s.nodes[0].y).toBe(0);
    const points = s.nodes.map((n) => `${Math.round(n.x)},${Math.round(n.y)}`);
    // the vast majority land on unique coordinates
    expect(new Set(points).size).toBeGreaterThan(s.nodes.length * 0.8);
  });
});
