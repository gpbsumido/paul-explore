"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { COLLECTIBLES } from "@/lib/world/collectibles";
import type { PlayerSnapshot } from "./refs";
import { useSegments } from "./detail";

const GOLD = "#f5c542";
// Tokens only animate near the player, same budget trick as the vignettes.
const ANIMATE_RANGE_SQ = 40 * 40;

type TokenProps = {
  readonly x: number;
  readonly z: number;
  readonly elevated: boolean;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
};

function Token({ x, z, elevated, playerRef, prefersReduced }: TokenProps) {
  const coinRef = useRef<THREE.Group>(null);
  const round = useSegments(22);
  const baseY = elevated ? 2 : 0.9;

  useFrame(({ clock }) => {
    const coin = coinRef.current;
    if (!coin || prefersReduced) return;
    const player = playerRef.current;
    if (player) {
      const dx = player.x - x;
      const dz = player.z - z;
      if (dx * dx + dz * dz > ANIMATE_RANGE_SQ) return;
    }
    coin.rotation.y = clock.elapsedTime * 1.6;
    coin.position.y = baseY + Math.sin(clock.elapsedTime * 2 + x) * 0.12;
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={coinRef} position={[0, baseY, 0]}>
        {/* a standing TTC-style token: golden coin with a raised rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.07, round]} />
          <meshStandardMaterial
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={0.45}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[0.34, 0.045, 10, round]} />
          <meshStandardMaterial
            color="#d4a017"
            roughness={0.35}
            metalness={0.6}
          />
        </mesh>
      </group>
      {/* soft landing light so tokens read from a distance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial
          color={GOLD}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

type CollectiblesProps = {
  readonly collected: readonly string[];
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
};

/** Every token still out there. Collected ones simply stop existing. */
export default function Collectibles({
  collected,
  playerRef,
  prefersReduced,
}: CollectiblesProps) {
  return (
    <group>
      {COLLECTIBLES.filter((token) => !collected.includes(token.id)).map(
        (token) => (
          <Token
            key={token.id}
            x={token.x}
            z={token.z}
            elevated={!!token.elevated}
            playerRef={playerRef}
            prefersReduced={prefersReduced}
          />
        ),
      )}
    </group>
  );
}
