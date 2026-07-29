import type { Vec2 } from "@/types/world";
import { SPAWN } from "./cityLayout";
import { EXHIBITS } from "./exhibits";
import { routeWaypoints } from "./routing";
import { WALK_SPEED } from "./movement";

// The ghost stroll: a previous visit through the city, replayed as a
// translucent explorer. Recording, storage shape, and replay interpolation
// are all pure — the same shapes a live-presence upgrade would put on the
// wire later (see plans/2026-07-28-world-multiplayer.md).

export type GhostPoint = {
  readonly x: number;
  readonly z: number;
  // Seconds since the recording started.
  readonly t: number;
};

export type GhostPath = {
  readonly outfitId: string;
  readonly points: readonly GhostPoint[];
};

// Sampling: only when actually moving, never faster than the interval, and
// capped so a marathon session still fits comfortably in localStorage.
const SAMPLE_MIN_DISTANCE = 0.75;
const SAMPLE_MIN_INTERVAL = 0.4;
export const MAX_SAMPLES = 600;
// Shorter recordings than this are too boring to haunt anyone with.
export const MIN_REPLAY_POINTS = 20;
// The ghost slips away between loops instead of teleporting.
export const LOOP_PAUSE = 4;

/**
 * Appends a movement sample when it's worth keeping: enough time since the
 * last one AND enough distance covered. Returns the same array reference when
 * nothing was recorded, so callers can cheaply detect no-ops.
 */
export function recordSample(
  points: readonly GhostPoint[],
  candidate: GhostPoint,
): readonly GhostPoint[] {
  const last = points[points.length - 1];
  if (last) {
    if (candidate.t - last.t < SAMPLE_MIN_INTERVAL) return points;
    if (Math.hypot(candidate.x - last.x, candidate.z - last.z) < SAMPLE_MIN_DISTANCE)
      return points;
  }
  const appended = [...points, candidate];
  return appended.length > MAX_SAMPLES ? appended.slice(appended.length - MAX_SAMPLES) : appended;
}

/**
 * Where the ghost stands `seconds` into its haunt: linear interpolation over
 * the recorded timeline, looping with a short vanish between loops. Null when
 * the path is too short or the ghost is between loops.
 */
export function ghostPoseAt(
  points: readonly GhostPoint[],
  seconds: number,
): { x: number; z: number; heading: number } | null {
  if (points.length < MIN_REPLAY_POINTS) return null;
  const start = points[0].t;
  const duration = points[points.length - 1].t - start;
  if (duration <= 0) return null;

  const cycle = duration + LOOP_PAUSE;
  const local = ((seconds % cycle) + cycle) % cycle;
  if (local > duration) return null;

  const target = start + local;
  const nextIndex = points.findIndex((p) => p.t >= target);
  if (nextIndex <= 0) {
    const first = points[0];
    const second = points[1];
    return { x: first.x, z: first.z, heading: Math.atan2(second.x - first.x, second.z - first.z) };
  }
  const a = points[nextIndex - 1];
  const b = points[nextIndex];
  const span = b.t - a.t;
  const blend = span > 0 ? (target - a.t) / span : 0;
  return {
    x: a.x + (b.x - a.x) * blend,
    z: a.z + (b.z - a.z) * blend,
    heading: Math.atan2(b.x - a.x, b.z - a.z),
  };
}

// A relaxed sightseeing pace for the generated tour.
const TOUR_SPEED = WALK_SPEED * 0.8;

// The fallback ghost's itinerary: the main exhibition plus a loop of crowd
// pleasers across the map.
const TOUR_STOPS = [
  "work-portfolio",
  "particles",
  "pokemon",
  "design-system",
  "calendar",
  "vitals",
] as const;

/**
 * A synthetic previous visitor: walks from spawn through a handful of
 * exhibits along real streets, timed at a strolling pace. Used until the
 * visitor has a recorded stroll of their own.
 */
export function tourPath(): GhostPath {
  const stops = TOUR_STOPS.map(
    (id) => EXHIBITS.find((e) => e.featureId === id)?.position,
  ).filter((p): p is Vec2 => p !== undefined);

  const waypoints = stops.reduce<Vec2[]>(
    (path, stop) => [...path, ...routeWaypoints(path[path.length - 1], stop)],
    [{ x: SPAWN.x, z: SPAWN.z }],
  );

  const points = waypoints.reduce<GhostPoint[]>((acc, waypoint, i) => {
    if (i === 0) return [{ x: waypoint.x, z: waypoint.z, t: 0 }];
    const prev = acc[acc.length - 1];
    const distance = Math.hypot(waypoint.x - prev.x, waypoint.z - prev.z);
    if (distance < 0.5) return acc;
    return [...acc, { x: waypoint.x, z: waypoint.z, t: prev.t + distance / TOUR_SPEED }];
  }, []);

  return { outfitId: "blue-jays", points };
}
