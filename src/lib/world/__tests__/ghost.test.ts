import { describe, it, expect } from "vitest";
import {
  recordSample,
  ghostPoseAt,
  tourPath,
  MAX_SAMPLES,
  MIN_REPLAY_POINTS,
  LOOP_PAUSE,
} from "../ghost";
import { SPAWN } from "../cityLayout";
import { EXHIBITS } from "../exhibits";
import { INTERACT_RADIUS } from "../proximity";
import type { GhostPoint } from "../ghost";

const walkEast = (count: number): GhostPoint[] =>
  Array.from({ length: count }, (_, i) => ({ x: i, z: 0, t: i * 0.5 }));

describe("recordSample", () => {
  it("keeps the first sample", () => {
    expect(recordSample([], { x: 0, z: 0, t: 0 })).toEqual([{ x: 0, z: 0, t: 0 }]);
  });

  it("ignores samples that arrive too fast", () => {
    const points = [{ x: 0, z: 0, t: 0 }];
    expect(recordSample(points, { x: 5, z: 0, t: 0.1 })).toBe(points);
  });

  it("ignores standing still so replays skip the idle time", () => {
    const points = [{ x: 0, z: 0, t: 0 }];
    expect(recordSample(points, { x: 0.1, z: 0, t: 5 })).toBe(points);
  });

  it("records real movement", () => {
    const points = recordSample([{ x: 0, z: 0, t: 0 }], { x: 2, z: 0, t: 1 });
    expect(points).toHaveLength(2);
  });

  it("caps the path length by dropping the oldest samples", () => {
    const full = walkEast(MAX_SAMPLES);
    const capped = recordSample(full, { x: 9999, z: 0, t: 99999 });
    expect(capped).toHaveLength(MAX_SAMPLES);
    expect(capped[capped.length - 1].x).toBe(9999);
    expect(capped[0].x).toBe(1);
  });
});

describe("ghostPoseAt", () => {
  const path = walkEast(MIN_REPLAY_POINTS + 10);
  const duration = path[path.length - 1].t;

  it("refuses paths too short to be worth replaying", () => {
    expect(ghostPoseAt(walkEast(MIN_REPLAY_POINTS - 1), 1)).toBeNull();
  });

  it("interpolates between samples", () => {
    const pose = ghostPoseAt(path, 0.25);
    expect(pose?.x).toBeCloseTo(0.5);
    expect(pose?.z).toBeCloseTo(0);
  });

  it("faces the direction of travel", () => {
    const pose = ghostPoseAt(path, 0.25);
    // Walking +x means heading atan2(dx, dz) = +π/2.
    expect(pose?.heading).toBeCloseTo(Math.PI / 2);
  });

  it("hides in the pause between loops", () => {
    expect(ghostPoseAt(path, duration + LOOP_PAUSE / 2)).toBeNull();
  });

  it("loops back to the start after the pause", () => {
    const pose = ghostPoseAt(path, duration + LOOP_PAUSE + 0.25);
    expect(pose?.x).toBeCloseTo(0.5);
  });
});

describe("tourPath", () => {
  const tour = tourPath();

  it("is long enough to replay", () => {
    expect(tour.points.length).toBeGreaterThanOrEqual(MIN_REPLAY_POINTS);
  });

  it("starts at the spawn", () => {
    expect(tour.points[0].x).toBe(SPAWN.x);
    expect(tour.points[0].z).toBe(SPAWN.z);
  });

  it("keeps time strictly moving forward", () => {
    for (let i = 1; i < tour.points.length; i += 1) {
      expect(tour.points[i].t).toBeGreaterThan(tour.points[i - 1].t);
    }
  });

  it("walks past the main exhibition", () => {
    const union = EXHIBITS.find((e) => e.featured)!;
    const closest = Math.min(
      ...tour.points.map((p) => Math.hypot(p.x - union.position.x, p.z - union.position.z)),
    );
    expect(closest).toBeLessThanOrEqual(INTERACT_RADIUS);
  });

  it("visits several exhibits, not just one", () => {
    const visited = EXHIBITS.filter((e) =>
      tour.points.some(
        (p) => Math.hypot(p.x - e.position.x, p.z - e.position.z) <= INTERACT_RADIUS,
      ),
    );
    expect(visited.length).toBeGreaterThanOrEqual(4);
  });
});
