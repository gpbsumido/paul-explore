import { describe, it, expect } from "vitest";
import { routeWaypoints } from "../routing";
import { ROADS } from "../cityLayout";
import { EXHIBITS } from "../exhibits";
import { SPAWN } from "../cityLayout";

const ewAts = ROADS.filter((r) => r.orientation === "ew").map((r) => r.at);
const nsAts = ROADS.filter((r) => r.orientation === "ns").map((r) => r.at);

const onRoad = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  (a.z === b.z && ewAts.includes(a.z)) || (a.x === b.x && nsAts.includes(a.x));

describe("routeWaypoints", () => {
  it("ends at the target", () => {
    const to = { x: -14, z: 31.5 };
    const route = routeWaypoints(SPAWN, to);
    expect(route[route.length - 1]).toEqual(to);
  });

  it("keeps every long leg on an actual street", () => {
    for (const exhibit of EXHIBITS) {
      const route = [SPAWN, ...routeWaypoints(SPAWN, exhibit.position)];
      for (let i = 1; i < route.length; i += 1) {
        const a = route[i - 1];
        const b = route[i];
        const length = Math.hypot(a.x - b.x, a.z - b.z);
        // Joining hops on and off the road network stay under half a block;
        // anything longer must run along a real corridor.
        if (length > 13) {
          expect(onRoad(a, b), `${exhibit.featureId}: leg ${i} wanders off-road`).toBe(true);
        }
      }
    }
  });

  it("routes across town along the avenue nearest the target", () => {
    const route = routeWaypoints({ x: 18.5, z: -70 }, { x: 17, z: 40 });
    // Hugging Yonge (x=18) is the long leg here.
    expect(route.some((p) => p.x === 18)).toBe(true);
  });
});
