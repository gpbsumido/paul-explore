import { z } from "zod";

// Live presence: the wire shape and the pure decisions around it — when to
// publish, how to pose a peer between network snapshots, when a peer is gone.
// The transports and the hook live in src/app/world/presence/; this module is
// plain data-in data-out, tested like the rest of the world core. It is the
// live twin of ghost.ts, as planned in plans/2026-07-28-world-multiplayer.md.

export const presenceSnapshotSchema = z.object({
  x: z.number().finite(),
  z: z.number().finite(),
  heading: z.number().finite(),
  outfitId: z.string().max(32),
  // Names come from EXPLORER_NAMES only — the cap is a backstop against a
  // tampered client, not a formatting rule.
  name: z.string().max(24),
});

export const presenceMessageSchema = z.object({
  peerId: z.string().min(1).max(64),
  snap: presenceSnapshotSchema,
});

export type PresenceSnapshot = z.infer<typeof presenceSnapshotSchema>;
export type PresenceMessage = z.infer<typeof presenceMessageSchema>;

export type TimedSnapshot = {
  readonly snap: PresenceSnapshot;
  // Local receipt/send time in ms (Date.now / performance clock — caller's choice,
  // as long as it's consistent).
  readonly at: number;
};

export const PRESENCE_ROOM = "world-toronto";
export const PUBLISH_MIN_INTERVAL_MS = 100;
export const HEARTBEAT_MS = 2000;
export const PEER_TIMEOUT_MS = 5000;
export const RENDER_DELAY_MS = 120;
export const MAX_RENDERED_PEERS = 12;

const MOVED_EPSILON = 0.05;

/**
 * Whether it's worth putting this snapshot on the wire: at most ~10 Hz, only
 * when something changed, plus a slow heartbeat while idle so peers can tell
 * "standing still" from "gone".
 */
export function shouldPublish(
  last: TimedSnapshot | null,
  snap: PresenceSnapshot,
  now: number,
): boolean {
  if (!last) return true;
  if (now - last.at < PUBLISH_MIN_INTERVAL_MS) return false;
  const moved =
    Math.hypot(snap.x - last.snap.x, snap.z - last.snap.z) >= MOVED_EPSILON ||
    Math.abs(snap.heading - last.snap.heading) >= MOVED_EPSILON ||
    snap.outfitId !== last.snap.outfitId ||
    snap.name !== last.snap.name;
  if (moved) return true;
  return now - last.at >= HEARTBEAT_MS;
}

const shortestArc = (from: number, to: number) => {
  const raw = (to - from) % (Math.PI * 2);
  if (raw > Math.PI) return raw - Math.PI * 2;
  if (raw < -Math.PI) return raw + Math.PI * 2;
  return raw;
};

/**
 * Where to draw a peer right now: rendered slightly in the past so there is
 * almost always a pair of snapshots to interpolate between, with only a small
 * extrapolation allowance when the network hiccups.
 */
export function peerPoseAt(
  prev: TimedSnapshot | null,
  latest: TimedSnapshot,
  now: number,
): { x: number; z: number; heading: number } {
  if (!prev || latest.at <= prev.at) {
    return { x: latest.snap.x, z: latest.snap.z, heading: latest.snap.heading };
  }
  const renderAt = now - RENDER_DELAY_MS;
  const span = latest.at - prev.at;
  const blend = Math.min(Math.max((renderAt - prev.at) / span, 0), 1.3);
  return {
    x: prev.snap.x + (latest.snap.x - prev.snap.x) * blend,
    z: prev.snap.z + (latest.snap.z - prev.snap.z) * blend,
    heading:
      prev.snap.heading +
      shortestArc(prev.snap.heading, latest.snap.heading) * Math.min(blend, 1),
  };
}

/** A peer that has been silent past the heartbeat window is gone. */
export function isStale(latest: TimedSnapshot, now: number): boolean {
  return now - latest.at > PEER_TIMEOUT_MS;
}

// Curated, Toronto-flavoured, and deliberately the only names that ever
// render — no free text from the network reaches the screen.
export const EXPLORER_NAMES = [
  "Curious Beaver",
  "Night Raccoon",
  "Polite Moose",
  "Bay St Squirrel",
  "Gardiner Goose",
  "Patio Cardinal",
  "Streetcar Fox",
  "Island Heron",
  "PATH Rabbit",
  "Dundas Owl",
  "Harbour Otter",
  "Junction Coyote",
  "Rooftop Falcon",
  "Market Chipmunk",
] as const;

/** Deterministic pick from the curated list for a seed in [0, 1). */
export function explorerName(seed: number): string {
  const index = Math.min(
    EXPLORER_NAMES.length - 1,
    Math.max(0, Math.floor(seed * EXPLORER_NAMES.length)),
  );
  return EXPLORER_NAMES[index];
}
