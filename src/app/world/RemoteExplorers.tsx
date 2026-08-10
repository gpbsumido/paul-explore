"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { peerPoseAt, MAX_RENDERED_PEERS } from "@/lib/world/presence";
import type { PeerMeta, PeerState } from "./presence/useWorldPresence";
import { outfitById, SKIN_TONE } from "./outfits";
import { useSegments } from "./detail";
import { makeTextTexture } from "./textures";

type RemotePeerProps = {
  readonly meta: PeerMeta;
  readonly peersRef: RefObject<Map<string, PeerState>>;
};

/**
 * Another live visitor: the explorer silhouette in their chosen team colors
 * with their curated name overhead, posed by interpolating their last two
 * network snapshots slightly in the past.
 */
function RemotePeer({ meta, peersRef }: RemotePeerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const round = useSegments(18);
  const outfit = outfitById(meta.outfitId);

  const label = useMemo(
    () =>
      makeTextTexture(meta.name, {
        fontSize: 40,
        color: "#ffffff",
        background: "rgba(10, 13, 20, 0.7)",
        padding: 26,
      }),
    [meta.name],
  );
  useEffect(() => () => label.dispose(), [label]);
  const labelAspect = label.image.width / label.image.height;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const peer = peersRef.current?.get(meta.id);
    if (!peer) {
      group.visible = false;
      return;
    }
    const pose = peerPoseAt(peer.prev, peer.latest, Date.now());
    group.visible = true;
    group.position.set(pose.x, 0, pose.z);
    group.rotation.y = pose.heading;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.34, 0.42, 8, round]} />
        <meshStandardMaterial color={outfit.jersey} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.27, round, Math.ceil(round * 0.75)]} />
        <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.46, -0.01]}>
        <sphereGeometry
          args={[
            0.275,
            round,
            Math.ceil(round * 0.6),
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.52,
          ]}
        />
        <meshStandardMaterial color={outfit.cap} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      <sprite position={[0, 2.05, 0]} scale={[labelAspect * 0.55, 0.55, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

type RemoteExplorersProps = {
  readonly peers: readonly PeerMeta[];
  readonly peersRef: RefObject<Map<string, PeerState>>;
};

/** Everyone else in the city right now, capped so a crowd can't melt a GPU. */
export default function RemoteExplorers({
  peers,
  peersRef,
}: RemoteExplorersProps) {
  return (
    <group>
      {peers.slice(0, MAX_RENDERED_PEERS).map((meta) => (
        <RemotePeer key={meta.id} meta={meta} peersRef={peersRef} />
      ))}
    </group>
  );
}
