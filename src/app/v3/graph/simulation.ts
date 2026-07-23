import type { GraphData } from "./graphData";

/**
 * One node's live physics state. Coordinates live in an abstract, origin-centred
 * "sim space" — the renderer fits and scales that space to the viewport, so the
 * layout always fills the room available regardless of these raw numbers.
 */
export type SimNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** On-screen render radius (px), used by collision so nodes never overlap. */
  radius: number;
  /** Estimated half-width (px) of the node's label box, for label-aware collision. */
  labelHalf: number;
  /** Heavier nodes (hubs) drift less under the same force. */
  mass: number;
  /** Pinned nodes hold position: the root anchor, or a node being dragged. */
  pinned: boolean;
};

type SimEdge = { a: number; b: number; rest: number };

export type SimState = {
  nodes: SimNode[];
  edges: SimEdge[];
  index: Map<string, number>;
  /** Global "temperature": scales every force so the graph cools and settles. */
  alpha: number;
  /** Index of the hovered node, whose collision radius inflates to clear space around it. */
  focus: number | null;
  /** Indices of nodes currently showing a label, which collide by label width so labels don't overlap. */
  labeled: Set<number>;
};

export type SimParams = {
  repulsion: number;
  spring: number;
  gravity: number;
  /** How firmly overlapping nodes push apart (not scaled by alpha, so it holds at rest). */
  collision: number;
  /** Extra gap (px) kept between node edges on screen. */
  collisionPad: number;
  /** Extra clearance (px) added around the focused (hovered) node. */
  focusRadius: number;
  velocityDecay: number;
  alphaDecay: number;
  minAlpha: number;
};

export const DEFAULT_PARAMS: SimParams = {
  repulsion: 10000,
  spring: 0.05,
  gravity: 0.02,
  collision: 0.9,
  collisionPad: 32,
  focusRadius: 70,
  velocityDecay: 0.86,
  alphaDecay: 0.012,
  minAlpha: 0.004,
};

/** Small deterministic RNG so the initial scatter is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function massFor(radius: number): number {
  return radius * radius * 0.02;
}

/**
 * Build initial physics state, scattering nodes on a loose spiral around the
 * origin so the first frame already looks graph-like before forces settle it.
 */
export function createSimState(data: GraphData): SimState {
  const rng = mulberry32(0x9e3779b9);

  // Rough per-kind character width so we can size labels without measuring DOM.
  const charW = (kind: string) =>
    kind === "root" ? 8 : kind === "hub" || kind === "category" ? 7 : 6.2;

  const nodes: SimNode[] = data.nodes.map((node, i) => {
    const isRoot = node.kind === "root";
    const angle = i * 2.399963; // golden angle
    const radius = isRoot ? 0 : 40 + 26 * Math.sqrt(i);
    return {
      id: node.id,
      x: isRoot ? 0 : Math.cos(angle) * radius + (rng() - 0.5) * 40,
      y: isRoot ? 0 : Math.sin(angle) * radius + (rng() - 0.5) * 40,
      vx: 0,
      vy: 0,
      radius: node.radius,
      labelHalf: (node.label.length * charW(node.kind)) / 2 + 10,
      mass: massFor(node.radius),
      pinned: isRoot,
    };
  });

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const edges: SimEdge[] = data.edges.map((e) => ({
    a: index.get(e.source)!,
    b: index.get(e.target)!,
    rest: e.rest,
  }));

  // Hubs, categories and the root are labelled at rest, so they collide by
  // label width from the start.
  const labeled = new Set<number>();
  data.nodes.forEach((n, i) => {
    if (n.kind === "root" || n.kind === "hub" || n.kind === "category") {
      labeled.add(i);
    }
  });

  return { nodes, edges, index, alpha: 1, focus: null, labeled };
}

/** Nudge the temperature back up so the layout re-settles after interaction. */
export function reheat(state: SimState, to = 0.5): void {
  state.alpha = Math.max(state.alpha, to);
}

/**
 * Advance the simulation one tick: pairwise repulsion, spring forces along
 * edges, a gentle pull toward the origin, then integrate with damping. All
 * forces scale with alpha, which decays every tick so the graph comes to rest.
 * There is no viewport clamp — the renderer fits the result to the screen.
 */
export function stepSimulation(
  state: SimState,
  params: SimParams,
  screenScale = 1,
): void {
  const { nodes, edges, alpha } = state;
  const n = nodes.length;

  const fx = new Float64Array(n);
  const fy = new Float64Array(n);

  // Effective collision radius per node (screen px): a labelled node claims its
  // label half-width so label boxes don't overlap; the focused node claims extra.
  const eff = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const base = state.labeled.has(k)
      ? Math.max(nodes[k].radius, nodes[k].labelHalf)
      : nodes[k].radius;
    eff[k] = base + (k === state.focus ? params.focusRadius : 0);
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let dx = nodes[i].x - nodes[j].x;
      let dy = nodes[i].y - nodes[j].y;
      let distSq = dx * dx + dy * dy;
      if (distSq < 0.01) {
        dx = (i - j) * 0.1 + 0.1;
        dy = 0.1;
        distSq = dx * dx + dy * dy;
      }
      const dist = Math.sqrt(distSq);
      const ux = dx / dist;
      const uy = dy / dist;

      const force = (params.repulsion * alpha) / distSq;
      fx[i] += ux * force;
      fy[i] += uy * force;
      fx[j] -= ux * force;
      fy[j] -= uy * force;

      // Collision: keep nodes (and their labels) from overlapping on screen.
      // Screen radii convert to sim units via the fit scale so it holds at any zoom.
      const minDist = (eff[i] + eff[j] + params.collisionPad) / screenScale;
      if (dist < minDist) {
        const push = (minDist - dist) * params.collision;
        fx[i] += ux * push;
        fy[i] += uy * push;
        fx[j] -= ux * push;
        fy[j] -= uy * push;
      }
    }
  }

  for (const edge of edges) {
    const a = nodes[edge.a];
    const b = nodes[edge.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const displacement = dist - edge.rest;
    const force = displacement * params.spring * alpha;
    const ux = dx / dist;
    const uy = dy / dist;
    fx[edge.a] += ux * force;
    fy[edge.a] += uy * force;
    fx[edge.b] -= ux * force;
    fy[edge.b] -= uy * force;
  }

  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    fx[i] += -node.x * params.gravity * alpha;
    fy[i] += -node.y * params.gravity * alpha;
  }

  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }
    node.vx = (node.vx + fx[i] / node.mass) * params.velocityDecay;
    node.vy = (node.vy + fy[i] / node.mass) * params.velocityDecay;
    node.x += node.vx;
    node.y += node.vy;
  }

  state.alpha = Math.max(params.minAlpha, alpha * (1 - params.alphaDecay));
}

/**
 * A tidy static radial layout (origin-centred) used when the visitor prefers
 * reduced motion: hubs on an inner ring, their leaves fanned out around them.
 */
export function radialLayout(state: SimState, data: GraphData): void {
  const inner = 200;
  const outer = 460;

  const hubs = data.nodes.filter(
    (nd) => nd.kind === "hub" || nd.kind === "category",
  );
  const place = (id: string, x: number, y: number) => {
    const i = state.index.get(id);
    if (i !== undefined) {
      state.nodes[i].x = x;
      state.nodes[i].y = y;
    }
  };

  place("root", 0, 0);
  hubs.forEach((hub, hi) => {
    const angle = (hi / hubs.length) * Math.PI * 2 - Math.PI / 2;
    place(hub.id, Math.cos(angle) * inner, Math.sin(angle) * inner);

    const children = data.edges
      .filter((e) => e.source === hub.id)
      .map((e) => e.target);
    children.forEach((childId, ci) => {
      const spread = (children.length - 1) / 2;
      const childAngle = angle + (ci - spread) * 0.16;
      place(childId, Math.cos(childAngle) * outer, Math.sin(childAngle) * outer);
    });
  });
}
