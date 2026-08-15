import {
  BoxGeometry,
  BufferGeometry,
  EdgesGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from "three";

/**
 * Particle sampling for the hero object.
 *
 * Each shape becomes a fixed-size cloud of points sampled uniformly along its
 * wireframe edges, so a morph is nothing more than sending particle i of the
 * current cloud to slot i of the next one. Everything here is plain geometry
 * maths with no renderer, which is why it is unit-testable in jsdom.
 */

/** Particles per shape. Every cloud has exactly this many, so morphs map 1:1. */
export const PARTICLE_COUNT = 1500;

/** Share of the morph a single particle spends travelling. The rest is stagger. */
const TRAVEL_SHARE = 0.6;

/** Deterministic PRNG so a shape samples the same cloud on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The geometry each shape id stands on. Kept in one place with the sampler. */
function buildGeometry(id: string): BufferGeometry {
  switch (id) {
    case "globe":
      return new IcosahedronGeometry(1.35, 1);
    case "ball":
      return new SphereGeometry(1.15, 12, 8);
    case "card":
      return new BoxGeometry(1.6, 2.2, 0.08);
    case "graph":
      return new OctahedronGeometry(1.35, 0);
    case "reel":
      return new TorusGeometry(1.15, 0.42, 8, 18);
    default:
      return new TorusKnotGeometry(0.95, 0.22, 32, 4, 2, 3);
  }
}

/** Seed per shape id, stable across sessions. */
function seedFor(id: string): number {
  let seed = 7;
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return seed;
}

/**
 * Samples PARTICLE_COUNT points uniformly along a shape's wireframe edges.
 * Uniform by edge length, not by edge count, or short edges would read denser
 * than long ones and the silhouette would clump.
 */
export function buildShapePoints(id: string): Float32Array {
  const geometry = buildGeometry(id);
  const edges = new EdgesGeometry(geometry);
  const pos = edges.getAttribute("position");
  const segments = pos.count / 2;

  const lengths = new Float32Array(segments);
  let total = 0;
  for (let s = 0; s < segments; s++) {
    const ax = pos.getX(s * 2);
    const ay = pos.getY(s * 2);
    const az = pos.getZ(s * 2);
    const bx = pos.getX(s * 2 + 1);
    const by = pos.getY(s * 2 + 1);
    const bz = pos.getZ(s * 2 + 1);
    total += lengths[s] = Math.hypot(bx - ax, by - ay, bz - az);
  }

  const rand = mulberry32(seedFor(id));
  const out = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let r = rand() * total;
    let s = 0;
    while (s < segments - 1 && r > lengths[s]) r -= lengths[s++];
    const t = lengths[s] > 0 ? r / lengths[s] : 0;
    out[i * 3] = pos.getX(s * 2) + (pos.getX(s * 2 + 1) - pos.getX(s * 2)) * t;
    out[i * 3 + 1] =
      pos.getY(s * 2) + (pos.getY(s * 2 + 1) - pos.getY(s * 2)) * t;
    out[i * 3 + 2] =
      pos.getZ(s * 2) + (pos.getZ(s * 2 + 1) - pos.getZ(s * 2)) * t;
  }

  geometry.dispose();
  edges.dispose();
  return out;
}

/**
 * Where one particle is in the morph, given the cloud's progress t and the
 * particle's stagger offset, both in [0, 1]. Early-offset particles leave
 * first, everyone lands together at t = 1, and the ease is a smoothstep so
 * departures and landings never snap.
 */
export function particleProgress(t: number, offset: number): number {
  const start = offset * (1 - TRAVEL_SHARE);
  const p = Math.min(Math.max((t - start) / TRAVEL_SHARE, 0), 1);
  return p * p * (3 - 2 * p);
}
