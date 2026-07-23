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
const FLAT_COL_W = 170; // column pitch
const FLAT_ROW_H = 40; // vertical pitch within a column
const FLAT_HEADER_Y = 150; // y of the hub/category header row
const FLAT_PAD = 36;

/**
 * A compact grouped-column layout for the flat view: the root sits at the top,
 * each hub/category is a column header directly below it, and that group's
 * items stack vertically under their header. This keeps the whole graph a few
 * columns wide (readable, mostly on-screen) instead of one enormous row.
 * Positions are node centres in px.
 */
export function buildLayeredLayout(data: GraphData): LayeredLayout {
  const children = new Map<string, string[]>();
  for (const e of data.edges) {
    if (e.bridge) continue;
    const list = children.get(e.source);
    if (list) list.push(e.target);
    else children.set(e.source, [e.target]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const groups = children.get("root") ?? [];
  let maxRows = 0;

  groups.forEach((groupId, i) => {
    const colX = FLAT_PAD + FLAT_COL_W / 2 + i * FLAT_COL_W;
    positions.set(groupId, { x: colX, y: FLAT_HEADER_Y });
    const kids = children.get(groupId) ?? [];
    maxRows = Math.max(maxRows, kids.length);
    kids.forEach((kid, j) => {
      positions.set(kid, { x: colX, y: FLAT_HEADER_Y + (j + 1) * FLAT_ROW_H });
    });
  });

  const firstX = FLAT_PAD + FLAT_COL_W / 2;
  const lastX = FLAT_PAD + FLAT_COL_W / 2 + (groups.length - 1) * FLAT_COL_W;
  positions.set("root", { x: (firstX + lastX) / 2, y: FLAT_PAD + 16 });

  return {
    positions,
    width: FLAT_PAD * 2 + groups.length * FLAT_COL_W,
    height: FLAT_HEADER_Y + (maxRows + 1) * FLAT_ROW_H + FLAT_PAD,
  };
}
