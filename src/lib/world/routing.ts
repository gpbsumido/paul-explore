import type { Vec2 } from "@/types/world";
import { ROADS } from "./cityLayout";

// Streets are guaranteed clear of buildings, so the exhibit speedrun travels
// the road graph: a short hop onto the nearest cross street, along it to the
// avenue nearest the target, down that avenue, along the target's cross
// street, then a short hop off the road to the booth. Only the first and last
// hops ever leave pavement, and they're at most half a block.

const nearest = (values: readonly number[], to: number) =>
  values.reduce((best, at) => (Math.abs(to - at) < Math.abs(to - best) ? at : best));

const dedupe = (points: readonly Vec2[]) =>
  points.filter((p, i) => {
    const prev = points[i - 1];
    return !prev || Math.hypot(p.x - prev.x, p.z - prev.z) > 1;
  });

/** Plans street-following waypoints from one point to another. */
export function routeWaypoints(from: Vec2, to: Vec2): readonly Vec2[] {
  const ewAts = ROADS.filter((r) => r.orientation === "ew").map((r) => r.at);
  const nsAts = ROADS.filter((r) => r.orientation === "ns").map((r) => r.at);
  const joinRow = nearest(ewAts, from.z);
  const avenue = nearest(nsAts, to.x);
  const exitRow = nearest(ewAts, to.z);

  return dedupe([
    { x: from.x, z: joinRow },
    { x: avenue, z: joinRow },
    { x: avenue, z: exitRow },
    { x: to.x, z: exitRow },
    to,
  ]);
}
