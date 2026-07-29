import type { RectCollider } from "@/types/world";
import { EXHIBITS } from "./exhibits";

// ---------------------------------------------------------------------------
// A stylized downtown Toronto. North is -z, the lake is south. One unit is
// roughly four meters, compressed hard so the walk between landmarks stays fun.
// ---------------------------------------------------------------------------

export type Road = {
  readonly name: string;
  readonly orientation: "ns" | "ew";
  // The fixed axis: x for ns roads, z for ew roads.
  readonly at: number;
  readonly from: number;
  readonly to: number;
  readonly width: number;
};

export type BuildingSpec = {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  // 0..1, picks the facade tint in the scene.
  readonly tint: number;
};

// South of Queens Quay it's all water.
export const LAKE_EDGE_Z = 57;

export const SPAWN = { x: -18, z: -6 } as const;

export const ROADS: readonly Road[] = [
  { name: "College St", orientation: "ew", at: -60, from: -78, to: 78, width: 6 },
  { name: "Dundas St W", orientation: "ew", at: -36, from: -78, to: 78, width: 6 },
  { name: "Queen St W", orientation: "ew", at: -12, from: -78, to: 78, width: 6 },
  { name: "King St W", orientation: "ew", at: 8, from: -78, to: 78, width: 6 },
  { name: "Front St W", orientation: "ew", at: 28, from: -78, to: 78, width: 6 },
  { name: "Queens Quay W", orientation: "ew", at: 54, from: -78, to: 78, width: 6 },
  { name: "Spadina Ave", orientation: "ns", at: -60, from: -78, to: 28, width: 6 },
  { name: "University Ave", orientation: "ns", at: -30, from: -64, to: 28, width: 8 },
  { name: "Bay St", orientation: "ns", at: -6, from: -60, to: 28, width: 6 },
  { name: "Yonge St", orientation: "ns", at: 18, from: -78, to: 54, width: 6 },
  { name: "Church St", orientation: "ns", at: 42, from: -78, to: 28, width: 6 },
];

// The streetcar shuttles along Queen St W, the classic 501 route.
export const STREETCAR_ROUTE = { z: -12, minX: -72, maxX: 72 } as const;

// Anchor points the scene builds its bespoke landmark meshes around.
export const LANDMARKS = {
  // right beside the Rogers Centre, as in life
  cnTower: { x: -44, z: 42 },
  rogersCentre: { x: -58, z: 44 },
  scotiabankArena: { x: 6, z: 46 },
  unionStation: { x: -14, z: 36 },
  cityHall: { x: -18, z: -29 },
  torontoSign: { x: -18, z: -20 },
  eatonCentre: { x: 8, z: -24 },
  ydBillboards: { x: 28, z: -44 },
  ago: { x: -46, z: -28 },
  ocad: { x: -44, z: -18 },
  // the Gooderham sits WEST of Church, its point aimed at downtown
  flatiron: { x: 36, z: 20 },
  stLawrenceMarket: { x: 56, z: 36.5 },
  queensPark: { x: -30, z: -70 },
  kensington: { x: -70, z: -48 },
  // King's College Circle sits west of Queen's Park in real life.
  campus: { x: -46, z: -72 },
} as const;

// Footprints of the hand-built landmark meshes. OCAD is deliberately absent —
// its tabletop floats on stilts, so you can walk right underneath it.
const LANDMARK_COLLIDERS: readonly RectCollider[] = [
  { x: -30, z: -70, halfX: 8, halfZ: 4 }, // Queen's Park legislature
  { x: -73, z: -52, halfX: 2, halfZ: 2 }, // Kensington shops
  { x: -73, z: -45, halfX: 2, halfZ: 2 },
  { x: -68, z: -54, halfX: 2, halfZ: 2 },
  { x: -67, z: -42, halfX: 2.5, halfZ: 2 },
  { x: -46, z: -28, halfX: 9, halfZ: 3 }, // AGO
  { x: -18, z: -29, halfX: 8, halfZ: 3.5 }, // City Hall towers
  { x: -18, z: -20, halfX: 5, halfZ: 0.8 }, // TORONTO sign
  { x: 8, z: -24, halfX: 6, halfZ: 8 }, // Eaton Centre
  { x: 28, z: -44, halfX: 6, halfZ: 4 }, // Yonge-Dundas billboard block
  { x: -14, z: 36, halfX: 11, halfZ: 3 }, // Union Station
  { x: 6, z: 46, halfX: 7, halfZ: 4 }, // Scotiabank Arena
  { x: -44, z: 42, halfX: 2.5, halfZ: 2.5 }, // CN Tower base
  { x: -58, z: 44, halfX: 9, halfZ: 8 }, // Rogers Centre
  { x: 56, z: 36.5, halfX: 8, halfZ: 3.5 }, // St. Lawrence Market
  { x: 36, z: 20, halfX: 3, halfZ: 2 }, // Gooderham Flatiron
  { x: -52, z: -73, halfX: 4, halfZ: 2.5 }, // U of T halls
  { x: -40, z: -76, halfX: 3.5, halfZ: 2.5 },
];

// Open ground the generator must leave alone: plazas, parks, the spawn point,
// a clearing around every exhibit, and the air under OCAD's tabletop.
const RESERVED: readonly RectCollider[] = [
  ...LANDMARK_COLLIDERS,
  { x: -44, z: -18, halfX: 7, halfZ: 3.5 }, // OCAD tabletop shadow
  { x: -18, z: -20, halfX: 10, halfZ: 7 }, // Nathan Phillips Square
  { x: 28, z: -27, halfX: 8, halfZ: 6 }, // Yonge-Dundas Square
  { x: -30, z: -68, halfX: 15, halfZ: 12 }, // Queen's Park green
  { x: -46, z: -71, halfX: 11, halfZ: 8 }, // campus green
  { x: -70, z: -48, halfX: 9, halfZ: 9 }, // Kensington laneways
  { x: SPAWN.x, z: SPAWN.z, halfX: 4, halfZ: 4 },
  ...EXHIBITS.map((e) => ({ x: e.position.x, z: e.position.z, halfX: 3.5, halfZ: 3.5 })),
];

// ---------------------------------------------------------------------------
// Procedural fill: generic downtown towers packed into the blocks between
// streets. Seeded and index-based, so the skyline is identical on every load.
// ---------------------------------------------------------------------------

const SEED = 416; // area code, obviously

/** Deterministic pseudo-random in [0, 1) for a given draw index. */
const randAt = (index: number) => {
  let t = (SEED + index * 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const NS_EDGES = [-78, -60, -30, -6, 18, 42, 78] as const;
const EW_EDGES = [-78, -60, -36, -12, 8, 28] as const;

const roadHalfAt = (position: number, orientation: "ns" | "ew") => {
  const road = ROADS.find((r) => r.orientation === orientation && r.at === position);
  return road ? road.width / 2 : 0;
};

const SIDEWALK = 2;

const inflatedOverlap = (a: RectCollider, b: RectCollider, margin: number) =>
  Math.abs(a.x - b.x) < a.halfX + b.halfX + margin &&
  Math.abs(a.z - b.z) < a.halfZ + b.halfZ + margin;

// The financial district gets real towers; everywhere else stays low-rise.
const heightFor = (x: number, z: number, r: number) => {
  const financial = x > -30 && x < 42 && z > -14 && z < 28;
  const midtown = z > -38 && z <= -14;
  if (financial) return 16 + r * 22;
  if (midtown) return 8 + r * 12;
  return 4 + r * 7;
};

const buildingsForCell = (cellIndex: number, x0: number, x1: number, z0: number, z1: number) => {
  const innerX0 = x0 + roadHalfAt(x0, "ns") + SIDEWALK;
  const innerX1 = x1 - roadHalfAt(x1, "ns") - SIDEWALK;
  const innerZ0 = z0 + roadHalfAt(z0, "ew") + SIDEWALK;
  const innerZ1 = z1 - roadHalfAt(z1, "ew") - SIDEWALK;
  const innerW = innerX1 - innerX0;
  const innerD = innerZ1 - innerZ0;
  if (innerW < 6 || innerD < 6) return [];

  const draw = (slot: number) => randAt(cellIndex * 64 + slot);

  // One building per quadrant of the block. Disjoint slots mean buildings can
  // never intersect each other — interpenetrating boxes put two window facades
  // in the same plane, and that z-fighting reads as flicker.
  const quadrants = [0, 1, 2, 3].map((q) => ({
    x0: innerX0 + (q % 2) * (innerW / 2),
    z0: innerZ0 + Math.floor(q / 2) * (innerD / 2),
    w: innerW / 2,
    d: innerD / 2,
  }));

  return quadrants.reduce<BuildingSpec[]>((placed, slot, i) => {
    if (draw(i * 8) < 0.18) return placed; // leave the odd empty lot
    const maxW = slot.w - 1;
    const maxD = slot.d - 1;
    if (maxW < 4 || maxD < 4) return placed;
    const width = Math.min(4.5 + draw(i * 8 + 1) * 8, maxW);
    const depth = Math.min(4.5 + draw(i * 8 + 2) * 8, maxD);
    const x = slot.x0 + 0.5 + width / 2 + draw(i * 8 + 3) * (maxW - width);
    const z = slot.z0 + 0.5 + depth / 2 + draw(i * 8 + 4) * (maxD - depth);
    const footprint = { x, z, halfX: width / 2, halfZ: depth / 2 };
    if (RESERVED.some((zone) => inflatedOverlap(footprint, zone, 1.5))) return placed;
    return [
      ...placed,
      { x, z, width, depth, height: heightFor(x, z, draw(i * 8 + 5)), tint: draw(i * 8 + 6) },
    ];
  }, []);
};

export const BUILDINGS: readonly BuildingSpec[] = NS_EDGES.slice(0, -1).flatMap((x0, i) =>
  EW_EDGES.slice(0, -1).flatMap((z0, j) =>
    buildingsForCell(i * EW_EDGES.length + j, x0, NS_EDGES[i + 1], z0, EW_EDGES[j + 1]),
  ),
);

export const COLLIDERS: readonly RectCollider[] = [
  ...BUILDINGS.map((b) => ({ x: b.x, z: b.z, halfX: b.width / 2, halfZ: b.depth / 2 })),
  ...LANDMARK_COLLIDERS,
];

// The same footprints with rooftop heights, for camera sightline checks.
// Landmarks get a nominal height — close enough for a camera that mostly
// fights the generated towers.
export const OCCLUDERS = [
  ...BUILDINGS.map((b) => ({
    x: b.x,
    z: b.z,
    halfX: b.width / 2,
    halfZ: b.depth / 2,
    height: b.height,
  })),
  ...LANDMARK_COLLIDERS.map((c) => ({ ...c, height: 9 })),
];
