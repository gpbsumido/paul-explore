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

/** Default physics with every force switched off except the ones named. */
const only = (...forces: ("repulsion" | "spring" | "gravity" | "collision")[]) => ({
  ...DEFAULT_PARAMS,
  repulsion: forces.includes("repulsion") ? DEFAULT_PARAMS.repulsion : 0,
  spring: forces.includes("spring") ? DEFAULT_PARAMS.spring : 0,
  gravity: forces.includes("gravity") ? DEFAULT_PARAMS.gravity : 0,
  collision: forces.includes("collision") ? DEFAULT_PARAMS.collision : 0,
});

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

  it("keep-out drives a node under the popover down past its bottom edge", () => {
    const keepOut = { xMin: -50, xMax: 50, yBottom: -40, strength: 0.35 };
    const withKeep = pairState(0, -100, 2000, 2000); // node 0 sits in the band
    const without = pairState(0, -100, 2000, 2000);
    for (let i = 0; i < 40; i++) {
      stepSimulation(withKeep, DEFAULT_PARAMS, 1, keepOut);
      stepSimulation(without, DEFAULT_PARAMS, 1, null);
    }
    // The keep-out pushes it lower than physics alone, and clear of the band.
    expect(withKeep.nodes[0].y).toBeGreaterThan(without.nodes[0].y);
    expect(withKeep.nodes[0].y).toBeGreaterThan(keepOut.yBottom - 1);
  });

  it("keep-out leaves nodes outside its x-span untouched", () => {
    const keepOut = { xMin: -50, xMax: 50, yBottom: -40, strength: 0.35 };
    const inBand = pairState(500, -100, 2000, 2000); // x=500 is outside the span
    const control = pairState(500, -100, 2000, 2000);
    stepSimulation(inBand, DEFAULT_PARAMS, 1, keepOut);
    stepSimulation(control, DEFAULT_PARAMS, 1, null);
    expect(inBand.nodes[0].y).toBeCloseTo(control.nodes[0].y, 10);
  });

  it("bounds pull a node that has drifted off screen back inside", () => {
    const bounds = {
      xMin: -400,
      xMax: 400,
      yMin: -300,
      yMax: 300,
      strength: 0.12,
    };
    // node 0 is way past the right/bottom edge; node 1 parked far away.
    const s = pairState(900, 700, -2000, -2000);
    const before = { x: s.nodes[0].x, y: s.nodes[0].y };
    for (let i = 0; i < 40; i++) {
      stepSimulation(s, DEFAULT_PARAMS, 1, null, bounds);
    }
    // It moves back toward the box on both axes.
    expect(s.nodes[0].x).toBeLessThan(before.x);
    expect(s.nodes[0].y).toBeLessThan(before.y);
    expect(s.nodes[0].x).toBeLessThan(bounds.xMax + 50);
    expect(s.nodes[0].y).toBeLessThan(bounds.yMax + 50);
  });

  it("bounds leave a node already inside the box alone", () => {
    const bounds = {
      xMin: -400,
      xMax: 400,
      yMin: -300,
      yMax: 300,
      strength: 0.12,
    };
    const inside = pairState(0, 0, 2000, 2000);
    const control = pairState(0, 0, 2000, 2000);
    stepSimulation(inside, DEFAULT_PARAMS, 1, null, bounds);
    stepSimulation(control, DEFAULT_PARAMS, 1, null, null);
    expect(inside.nodes[0].x).toBeCloseTo(control.nodes[0].x, 10);
    expect(inside.nodes[0].y).toBeCloseTo(control.nodes[0].y, 10);
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

describe("each force on its own", () => {
  it("repulsion alone pushes two nodes apart, and more gently the further apart they are", () => {
    const near = pairState(0, 0, 100, 0);
    const far = pairState(0, 0, 400, 0);
    stepSimulation(near, only("repulsion"));
    stepSimulation(far, only("repulsion"));

    expect(dist(near)).toBeGreaterThan(100);
    expect(dist(far)).toBeGreaterThan(400);
    expect(dist(near) - 100).toBeGreaterThan(dist(far) - 400);
  });

  it("collision alone pushes overlapping nodes apart and leaves clear ones where they are", () => {
    const overlapping = pairState(0, 0, 10, 0);
    const clear = pairState(0, 0, 500, 0);
    stepSimulation(overlapping, only("collision"));
    stepSimulation(clear, only("collision"));

    expect(dist(overlapping)).toBeGreaterThan(10);
    expect(dist(clear)).toBeCloseTo(500, 10);
  });

  it("collision keeps a bigger gap on a screen that is zoomed in", () => {
    const zoomedOut = pairState(0, 0, 10, 0);
    const zoomedIn = pairState(0, 0, 10, 0);
    stepSimulation(zoomedOut, only("collision"), 0.5);
    stepSimulation(zoomedIn, only("collision"), 2);

    // The same on-screen padding is a bigger span of sim space when zoomed out.
    expect(dist(zoomedOut)).toBeGreaterThan(dist(zoomedIn));
  });

  it("collision gives a labelled node room for its label, and the hovered node extra", () => {
    const plain = pairState(0, 0, 40, 0);
    const labelled = pairState(0, 0, 40, 0);
    labelled.nodes[0].labelHalf = 80;
    labelled.labeled.add(0);
    const focused = pairState(0, 0, 40, 0);
    focused.focus = 0;

    stepSimulation(plain, only("collision"));
    stepSimulation(labelled, only("collision"));
    stepSimulation(focused, only("collision"));

    expect(dist(labelled)).toBeGreaterThan(dist(plain));
    expect(dist(focused)).toBeGreaterThan(dist(plain));
  });

  it("a spring pushes two connected nodes that are closer than its rest length apart", () => {
    const s = pairState(0, 0, 20, 0, true); // rest length is 100
    stepSimulation(s, only("spring"));
    expect(dist(s)).toBeGreaterThan(20);
  });

  it("a spring pulls far-apart connected nodes together", () => {
    const s = pairState(-400, 0, 400, 0, true);
    stepSimulation(s, only("spring"));
    expect(dist(s)).toBeLessThan(800);
  });

  it("a spring leaves two connected nodes at their rest length alone", () => {
    const s = pairState(0, 0, 100, 0, true);
    stepSimulation(s, only("spring"));
    expect(dist(s)).toBeCloseTo(100, 10);
  });

  it("gravity alone pulls a node toward the origin from any side", () => {
    for (const [x, y] of [[300, 0], [-300, 0], [0, 300], [0, -300]]) {
      const s = pairState(x, y, 5000, 5000);
      stepSimulation(s, only("gravity"));
      expect(Math.hypot(s.nodes[0].x, s.nodes[0].y), `${x},${y}`).toBeLessThan(300);
    }
  });

  it("sets a node that is past the edge heading back inward, not just snapped onto it", () => {
    const bounds = { xMin: -400, xMax: 400, yMin: -300, yMax: 300, strength: 0.12 };
    const s = pairState(900, 0, -2000, -2000);

    stepSimulation(s, only(), 1, null, bounds);

    expect(s.nodes[0].x).toBe(bounds.xMax);
    expect(s.nodes[0].vx).toBeLessThan(0);
  });

  it("clamps a node that overshoots the bounds back onto the edge, and stops it moving outward", () => {
    const bounds = { xMin: -400, xMax: 400, yMin: -300, yMax: 300, strength: 0.12 };
    const s = pairState(390, 0, -2000, -2000);
    s.nodes[0].vx = 500; // flung hard at the right edge

    stepSimulation(s, only(), 1, null, bounds);

    expect(s.nodes[0].x).toBe(bounds.xMax);
    expect(s.nodes[0].vx).toBe(0);
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

  it("cools by exactly the decay rate each tick, and never below the floor", () => {
    const s = createSimState(data);
    stepSimulation(s, DEFAULT_PARAMS);
    expect(s.alpha).toBeCloseTo(1 - DEFAULT_PARAMS.alphaDecay, 10);

    s.alpha = DEFAULT_PARAMS.minAlpha;
    stepSimulation(s, DEFAULT_PARAMS);
    expect(s.alpha).toBe(DEFAULT_PARAMS.minAlpha);
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

  it("puts every hub and category on one inner ring and their leaves on a wider outer ring", () => {
    const s = createSimState(data);
    radialLayout(s, data);
    const radiusOf = (id: string) => {
      const node = s.nodes[s.index.get(id)!];
      return Math.hypot(node.x, node.y);
    };

    const hubs = data.nodes.filter((n) => n.kind === "hub" || n.kind === "category");
    for (const hub of hubs) {
      expect(radiusOf(hub.id), hub.label).toBeCloseTo(200, 5);
      for (const edge of data.edges.filter((e) => e.source === hub.id)) {
        expect(radiusOf(edge.target), `${hub.label} > ${edge.target}`).toBeCloseTo(460, 5);
      }
    }
  });

  it("starts the first hub at the top and spaces the hubs evenly around the ring", () => {
    const s = createSimState(data);
    radialLayout(s, data);
    const hubs = data.nodes.filter((n) => n.kind === "hub" || n.kind === "category");
    const first = s.nodes[s.index.get(hubs[0].id)!];
    expect(first.x).toBeCloseTo(0, 5);
    expect(first.y).toBeCloseTo(-200, 5);

    const angles = hubs.map((hub) => {
      const node = s.nodes[s.index.get(hub.id)!];
      return Math.atan2(node.y, node.x);
    });
    const step = (2 * Math.PI) / hubs.length;
    angles.slice(1).forEach((angle, i) => {
      const gap = (((angle - angles[i]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      expect(gap).toBeCloseTo(step, 5);
    });
  });
});
