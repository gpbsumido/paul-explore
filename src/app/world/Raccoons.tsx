"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { RACCOONS, raccoonStep, type Raccoon, type RaccoonState } from "@/lib/world/wildlife";
import type { PlayerSnapshot } from "./refs";
import { useSegments } from "./detail";

const FUR = "#5a6170";
const FUR_DARK = "#2f343e";

type OneRaccoonProps = {
  readonly raccoon: Raccoon;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
};

function OneRaccoon({ raccoon, playerRef, prefersReduced }: OneRaccoonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const stateRef = useRef<RaccoonState>({
    x: raccoon.patrol[0].x,
    z: raccoon.patrol[0].z,
    heading: 0,
    fleeing: false,
  });
  const waddleRef = useRef(0);
  const round = useSegments(12);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group || prefersReduced) return;
    const player = playerRef.current ?? { x: 9999, z: 9999 };
    const next = raccoonStep(stateRef.current, raccoon, player, dt);
    stateRef.current = next;
    group.position.set(next.x, 0, next.z);
    group.rotation.y = next.heading;
    // A bolting raccoon scurries; a browsing one ambles.
    waddleRef.current += dt * (next.fleeing ? 22 : 7);
    const body = bodyRef.current;
    if (body) {
      body.position.y = Math.abs(Math.sin(waddleRef.current)) * 0.05;
      body.rotation.z = Math.sin(waddleRef.current) * 0.09;
    }
  });

  return (
    <group ref={groupRef} position={[raccoon.patrol[0].x, 0, raccoon.patrol[0].z]}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.16, 0.3, 4, round]} />
          <meshStandardMaterial color={FUR} roughness={0.9} />
        </mesh>
        {/* snout end, with the mask */}
        <mesh position={[0, 0.28, 0.3]}>
          <sphereGeometry args={[0.14, round, Math.ceil(round * 0.7)]} />
          <meshStandardMaterial color={FUR} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.3, 0.4]}>
          <boxGeometry args={[0.22, 0.08, 0.06]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.85} />
        </mesh>
        {/* ears */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.09, 0.4, 0.26]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
          </mesh>
        ))}
        {/* ringed tail */}
        <mesh position={[0, 0.32, -0.32]} rotation={[0.7, 0, 0]}>
          <capsuleGeometry args={[0.075, 0.26, 4, round]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

type RaccoonsProps = {
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
};

/** The city's other commuters. */
export default function Raccoons({ playerRef, prefersReduced }: RaccoonsProps) {
  return (
    <group>
      {RACCOONS.map((raccoon) => (
        <OneRaccoon
          key={raccoon.id}
          raccoon={raccoon}
          playerRef={playerRef}
          prefersReduced={prefersReduced}
        />
      ))}
    </group>
  );
}
