import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

/** What a node represents, which drives its size and styling. */
export type GraphNodeKind = "root" | "hub" | "feature" | "category" | "thought";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  /** Where clicking the node navigates. Omitted for structural nodes (root/hub). */
  href?: string;
  /** External links open in a new tab. */
  external?: boolean;
  /** Hex colour used for the node fill/glow and its edges. */
  color: string;
  /** Short blurb shown on hover. */
  blurb?: string;
  /** Base render radius in px, before hover scaling. */
  radius: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  /** Ideal resting length in px; longer for the trunk, shorter for leaves. */
  rest: number;
  /** A cross-link between a feature and its write-up, drawn with emphasis. */
  bridge?: boolean;
};

export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Stable colour per category so its cluster reads as one group. */
const CATEGORY_COLORS: Record<string, string> = {
  Features: "#818cf8",
  "Design & UI": "#f472b6",
  Performance: "#34d399",
  "Architecture & Backend": "#a78bfa",
  "Testing & Quality": "#fbbf24",
  Security: "#fb7185",
  "Build & Tooling": "#22d3ee",
  More: "#94a3b8",
};

const ROOT_COLOR = "#8b5cf6";
const FEATURES_HUB_COLOR = "#38bdf8";
/** Every feature node shares one colour so the feature cluster reads as a group. */
const FEATURE_COLOR = "#38bdf8";

const slugOf = (href: string): string => href.replace(/^\/thoughts\//, "");
const thoughtNodeId = (href: string): string => `thought:${slugOf(href)}`;
const categoryNodeId = (name: string): string => `cat:${name}`;

/**
 * Assemble the whole graph: a central root, a Features hub, one node per
 * feature and per write-up, and a hub per thought category. Edges wire the
 * trunk (root to hubs and categories), the leaves (hub/category to their
 * items), and the bridges (a feature to its own write-up via thoughtsHref).
 */
export function buildGraphData(): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: "root",
    kind: "root",
    label: "paul-explore",
    color: ROOT_COLOR,
    blurb: "Everything, and how it connects.",
    radius: 46,
  });

  nodes.push({
    id: "hub:features",
    kind: "hub",
    label: "Apps",
    color: FEATURES_HUB_COLOR,
    blurb: "The things you can actually use.",
    radius: 31,
  });
  edges.push({ source: "root", target: "hub:features", rest: 260 });

  for (const feature of FEATURES) {
    const id = `feat:${feature.id}`;
    nodes.push({
      id,
      kind: "feature",
      label: feature.title,
      href: feature.href,
      external: feature.href.startsWith("http"),
      color: FEATURE_COLOR,
      blurb: feature.description,
      radius: 16,
    });
    edges.push({ source: "hub:features", target: id, rest: 150 });

    if (feature.thoughtsHref) {
      edges.push({
        source: id,
        target: thoughtNodeId(feature.thoughtsHref),
        rest: 165,
        bridge: true,
      });
    }
  }

  for (const group of groupThoughts(THOUGHTS)) {
    const catId = categoryNodeId(group.name);
    const color = CATEGORY_COLORS[group.name] ?? "#94a3b8";
    nodes.push({
      id: catId,
      kind: "category",
      label: group.name,
      href: "/thoughts",
      color,
      blurb: `${group.items.length} write-ups`,
      radius: 28,
    });
    edges.push({ source: "root", target: catId, rest: 300 });

    for (const thought of group.items) {
      const id = thoughtNodeId(thought.href);
      nodes.push({
        id,
        kind: "thought",
        label: thought.title,
        href: thought.href,
        // Colour by category, not the write-up's own hue, so clusters read as groups.
        color,
        blurb: thought.preview,
        radius: 10,
      });
      edges.push({ source: catId, target: id, rest: 108 });
    }
  }

  return { nodes, edges };
}

export type LayeredLayout = {
  /** Node centre points in px. */
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
};

/** Node-box height in the flat view (width is per-kind, see FlatGraph). */
export const FLAT_NODE_H = 34;
const FLAT_LEVEL_GAP = 132; // vertical gap between depth levels
const FLAT_LEAF_GAP = 188; // horizontal gap between leaves
const FLAT_PAD = 90;

/**
 * A tidy top-down layered (tree) layout for the flat view: root at the top,
 * hubs/categories on the next level, their items below. Parents are centred
 * over their children. Positions are node centres in px; the flat view scrolls
 * horizontally if the leaf row is wider than the viewport, so nodes never
 * overlap.
 */
export function buildLayeredLayout(data: GraphData): LayeredLayout {
  const children = new Map<string, string[]>();
  for (const e of data.edges) {
    if (e.bridge) continue;
    const list = children.get(e.source);
    if (list) list.push(e.target);
    else children.set(e.source, [e.target]);
  }

  const depth = new Map<string, number>();
  const cx = new Map<string, number>();
  let nextLeaf = 0;

  // DFS: leaves take the next horizontal slot; parents centre over their kids.
  const dfs = (id: string, d: number): number => {
    depth.set(id, d);
    const kids = children.get(id) ?? [];
    let x: number;
    if (kids.length === 0) {
      x = nextLeaf++ * FLAT_LEAF_GAP;
    } else {
      const kidX = kids.map((k) => dfs(k, d + 1));
      x = kidX.reduce((a, b) => a + b, 0) / kidX.length;
    }
    cx.set(id, x);
    return x;
  };
  dfs("root", 0);

  let maxDepth = 0;
  for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);

  const positions = new Map<string, { x: number; y: number }>();
  for (const n of data.nodes) {
    const d = depth.get(n.id) ?? 0;
    const x = cx.get(n.id) ?? 0;
    positions.set(n.id, {
      x: FLAT_PAD + x,
      y: FLAT_PAD + d * FLAT_LEVEL_GAP,
    });
  }

  return {
    positions,
    width: FLAT_PAD * 2 + Math.max(nextLeaf - 1, 0) * FLAT_LEAF_GAP + 60,
    height: FLAT_PAD * 2 + maxDepth * FLAT_LEVEL_GAP + FLAT_NODE_H,
  };
}
