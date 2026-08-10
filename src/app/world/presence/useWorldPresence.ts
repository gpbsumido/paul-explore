"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { z } from "zod";
import { flagSchema } from "@/lib/flags-schemas";
import { evaluateFlag } from "@/lib/flags-engine";
import {
  shouldPublish,
  isStale,
  explorerName,
  type PresenceSnapshot,
  type TimedSnapshot,
} from "@/lib/world/presence";
import {
  createLocalTransport,
  createAblyTransport,
  type PresenceTransport,
} from "./transport";
import type { PlayerSnapshot } from "../refs";

// Kill switch in the flag console (/flags). Missing flag or unreachable API
// fails open, same philosophy as flags-gate: a config gap must never hide a
// working feature — and the fallback transport costs nothing anyway.
export const WORLD_PRESENCE_FLAG = "world-live-presence";

const fleetSchema = z.object({ flags: z.array(flagSchema) });

async function presenceAllowed(visitorKey: string): Promise<boolean> {
  try {
    const response = await fetch("/api/flags");
    if (!response.ok) return true;
    const fleet = fleetSchema.safeParse(await response.json());
    if (!fleet.success) return true;
    const flag = fleet.data.flags.find((f) => f.key === WORLD_PRESENCE_FLAG);
    if (!flag) return true;
    return (
      evaluateFlag(flag, "production", { key: visitorKey, attributes: {} })
        .value === true
    );
  } catch {
    return true;
  }
}

export type PeerState = {
  prev: TimedSnapshot | null;
  latest: TimedSnapshot;
  outfitId: string;
  name: string;
};

// The render-side view of a peer: stable identity + the slow-changing bits,
// kept in React state so components never read the ref during render.
export type PeerMeta = {
  readonly id: string;
  readonly name: string;
  readonly outfitId: string;
};

type PresenceOptions = {
  readonly enabled: boolean;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly outfitId: string;
};

/**
 * Live presence: publishes this explorer's pose (throttled, only when it
 * changed) and maintains the map of everyone else's. Ably when a key is
 * configured, BroadcastChannel between this browser's tabs otherwise, nothing
 * when the world-live-presence flag is off. Peers vanish after the timeout —
 * no explicit leave protocol needed.
 */
export function useWorldPresence({
  enabled,
  playerRef,
  outfitId,
}: PresenceOptions) {
  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const [peers, setPeers] = useState<readonly PeerMeta[]>([]);
  const outfitRef = useRef(outfitId);
  useEffect(() => {
    outfitRef.current = outfitId;
  }, [outfitId]);

  useEffect(() => {
    if (!enabled) {
      peersRef.current.clear();
      return;
    }
    let cancelled = false;
    let transport: PresenceTransport | null = null;
    let publishTimer: ReturnType<typeof setInterval> | undefined;
    let pruneTimer: ReturnType<typeof setInterval> | undefined;
    let lastSent: TimedSnapshot | null = null;
    const peerId = crypto.randomUUID();
    const name = explorerName(Math.random());

    const publishMeta = () => {
      setPeers(
        [...peersRef.current.entries()].map(([id, peer]) => ({
          id,
          name: peer.name,
          outfitId: peer.outfitId,
        })),
      );
    };

    const handleMessage = ({
      peerId: from,
      snap,
    }: {
      peerId: string;
      snap: PresenceSnapshot;
    }) => {
      if (cancelled) return;
      const map = peersRef.current;
      const existing = map.get(from);
      map.set(from, {
        prev: existing?.latest ?? null,
        latest: { snap, at: Date.now() },
        outfitId: snap.outfitId,
        name: snap.name,
      });
      const metaChanged =
        !existing ||
        existing.outfitId !== snap.outfitId ||
        existing.name !== snap.name;
      if (metaChanged) publishMeta();
    };

    void (async () => {
      if (!(await presenceAllowed(peerId)) || cancelled) return;
      const apiKey = process.env.NEXT_PUBLIC_ABLY_KEY;
      transport = apiKey
        ? await createAblyTransport(apiKey, peerId, handleMessage)
        : null;
      transport ??= createLocalTransport(peerId, handleMessage);
      if (cancelled || !transport) {
        transport?.close();
        transport = null;
        return;
      }

      publishTimer = setInterval(() => {
        const player = playerRef.current;
        if (!player || !transport) return;
        const snap: PresenceSnapshot = {
          x: player.x,
          z: player.z,
          heading: player.heading,
          outfitId: outfitRef.current,
          name,
        };
        const now = Date.now();
        if (!shouldPublish(lastSent, snap, now)) return;
        lastSent = { snap, at: now };
        transport.publish(snap);
      }, 50);

      pruneTimer = setInterval(() => {
        const map = peersRef.current;
        const now = Date.now();
        const before = map.size;
        for (const [id, peer] of map) {
          if (isStale(peer.latest, now)) map.delete(id);
        }
        if (map.size !== before) publishMeta();
      }, 1000);
    })();

    return () => {
      cancelled = true;
      clearInterval(publishTimer);
      clearInterval(pruneTimer);
      transport?.close();
      peersRef.current.clear();
    };
  }, [enabled, playerRef]);

  return { peersRef, peers };
}
