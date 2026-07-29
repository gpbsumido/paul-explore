import { describe, it, expect } from "vitest";
import {
  presenceMessageSchema,
  shouldPublish,
  peerPoseAt,
  isStale,
  explorerName,
  EXPLORER_NAMES,
  PUBLISH_MIN_INTERVAL_MS,
  HEARTBEAT_MS,
  PEER_TIMEOUT_MS,
  RENDER_DELAY_MS,
  type PresenceSnapshot,
  type TimedSnapshot,
} from "../presence";

const snap = (overrides: Partial<PresenceSnapshot> = {}): PresenceSnapshot => ({
  x: 0,
  z: 0,
  heading: 0,
  outfitId: "blue-jays",
  name: "Curious Beaver",
  ...overrides,
});

const timed = (s: PresenceSnapshot, at: number): TimedSnapshot => ({ snap: s, at });

describe("presenceMessageSchema", () => {
  it("accepts a valid wire message", () => {
    const parsed = presenceMessageSchema.safeParse({ peerId: "abc", snap: snap() });
    expect(parsed.success).toBe(true);
  });

  it("rejects junk from the wire", () => {
    expect(presenceMessageSchema.safeParse({ peerId: "abc" }).success).toBe(false);
    expect(
      presenceMessageSchema.safeParse({ peerId: "abc", snap: { x: "nope" } }).success,
    ).toBe(false);
    expect(
      presenceMessageSchema.safeParse({
        peerId: "abc",
        snap: snap({ name: "x".repeat(100) }),
      }).success,
    ).toBe(false);
  });
});

describe("shouldPublish", () => {
  it("always publishes the first snapshot", () => {
    expect(shouldPublish(null, snap(), 0)).toBe(true);
  });

  it("never publishes faster than the interval", () => {
    const last = timed(snap(), 1000);
    expect(shouldPublish(last, snap({ x: 50 }), 1000 + PUBLISH_MIN_INTERVAL_MS - 1)).toBe(false);
  });

  it("publishes movement once the interval has passed", () => {
    const last = timed(snap(), 1000);
    expect(shouldPublish(last, snap({ x: 1 }), 1000 + PUBLISH_MIN_INTERVAL_MS + 1)).toBe(true);
  });

  it("stays quiet while standing still", () => {
    const last = timed(snap(), 1000);
    expect(shouldPublish(last, snap(), 1000 + PUBLISH_MIN_INTERVAL_MS + 1)).toBe(false);
  });

  it("heartbeats while idle so peers know we're alive", () => {
    const last = timed(snap(), 1000);
    expect(shouldPublish(last, snap(), 1000 + HEARTBEAT_MS + 1)).toBe(true);
  });

  it("publishes an outfit change even without moving", () => {
    const last = timed(snap(), 1000);
    expect(
      shouldPublish(last, snap({ outfitId: "raptors" }), 1000 + PUBLISH_MIN_INTERVAL_MS + 1),
    ).toBe(true);
  });
});

describe("peerPoseAt", () => {
  it("uses the only snapshot it has", () => {
    const pose = peerPoseAt(null, timed(snap({ x: 5, z: -2, heading: 1 }), 1000), 2000);
    expect(pose).toEqual({ x: 5, z: -2, heading: 1 });
  });

  it("interpolates between the last two snapshots at the render delay", () => {
    const prev = timed(snap({ x: 0 }), 1000);
    const latest = timed(snap({ x: 10 }), 1200);
    // renderAt = 1100 → halfway between the two snapshots.
    const pose = peerPoseAt(prev, latest, 1100 + RENDER_DELAY_MS);
    expect(pose.x).toBeCloseTo(5);
  });

  it("only extrapolates a little past the latest snapshot", () => {
    const prev = timed(snap({ x: 0 }), 1000);
    const latest = timed(snap({ x: 10 }), 1200);
    const pose = peerPoseAt(prev, latest, 10_000);
    expect(pose.x).toBeLessThanOrEqual(13);
  });

  it("turns the short way across the ±π seam", () => {
    const prev = timed(snap({ heading: Math.PI - 0.1 }), 1000);
    const latest = timed(snap({ heading: -Math.PI + 0.1 }), 1200);
    const pose = peerPoseAt(prev, latest, 1100 + RENDER_DELAY_MS);
    expect(Math.abs(pose.heading)).toBeGreaterThan(Math.PI - 0.15);
  });
});

describe("isStale", () => {
  it("keeps fresh peers and drops silent ones", () => {
    const latest = timed(snap(), 1000);
    expect(isStale(latest, 1000 + PEER_TIMEOUT_MS - 1)).toBe(false);
    expect(isStale(latest, 1000 + PEER_TIMEOUT_MS + 1)).toBe(true);
  });
});

describe("explorerName", () => {
  it("picks deterministically from the curated list", () => {
    expect(explorerName(0)).toBe(EXPLORER_NAMES[0]);
    expect(explorerName(0.999)).toBe(EXPLORER_NAMES[EXPLORER_NAMES.length - 1]);
    expect(EXPLORER_NAMES).toContain(explorerName(0.5));
  });

  it("never produces free text", () => {
    for (const name of EXPLORER_NAMES) {
      expect(name.length).toBeLessThanOrEqual(24);
    }
  });
});
