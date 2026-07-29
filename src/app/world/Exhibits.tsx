"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { EXHIBITS } from "@/lib/world/exhibits";
import { FEATURES } from "@/app/_shared/featureData";
import type { WorldExhibit } from "@/types/world";
import type { PlayerSnapshot } from "./refs";
import { makeTextTexture } from "./textures";
import { VIGNETTES } from "./ExhibitVignettes";

// Vignettes only animate when the player is within this range (squared units).
const ANIMATE_RANGE_SQ = 30 * 30;

type ExhibitProps = {
  readonly exhibit: WorldExhibit;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
  readonly activeIdRef: RefObject<string | null>;
};

function Exhibit({ exhibit, playerRef, prefersReduced, activeIdRef }: ExhibitProps) {
  const feature = FEATURES.find((f) => f.id === exhibit.featureId);
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.MeshBasicMaterial>(null);
  const floatRef = useRef<THREE.Group>(null);

  const label = useMemo(
    () =>
      makeTextTexture(feature?.title ?? exhibit.featureId, {
        fontSize: 46,
        color: "#ffffff",
        background: "rgba(10, 13, 20, 0.78)",
        padding: 30,
      }),
    [feature?.title, exhibit.featureId],
  );
  useEffect(() => () => label.dispose(), [label]);
  const labelAspect = label.image.width / label.image.height;

  const animate = useCallback(() => {
    if (prefersReduced) return false;
    const player = playerRef.current;
    if (!player) return false;
    const dx = player.x - exhibit.position.x;
    const dz = player.z - exhibit.position.z;
    return dx * dx + dz * dz < ANIMATE_RANGE_SQ;
  }, [prefersReduced, playerRef, exhibit.position.x, exhibit.position.z]);

  useFrame(({ clock }) => {
    const isActive = activeIdRef.current === exhibit.featureId;
    if (ringRef.current) {
      const pulse =
        isActive && !prefersReduced ? 1 + Math.sin(clock.elapsedTime * 5) * 0.06 : 1;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
    if (beaconRef.current) {
      beaconRef.current.opacity = isActive ? 0.22 : 0.09;
    }
    if (floatRef.current && animate()) {
      floatRef.current.position.y = 2.6 + Math.sin(clock.elapsedTime * 1.1) * 0.12;
      floatRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25;
    }
  });

  if (!feature) return null;
  const Vignette = VIGNETTES[exhibit.featureId];

  return (
    <group position={[exhibit.position.x, 0, exhibit.position.z]}>
      {/* glowing ground ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.15, 1.55, 36]} />
        <meshBasicMaterial color={feature.color} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.15, 36]} />
        <meshBasicMaterial color={feature.color} transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* light beam */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.55, 1.1, 9, 16, 1, true]} />
        <meshBasicMaterial
          ref={beaconRef}
          color={feature.color}
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* floating diorama */}
      <group ref={floatRef} position={[0, 2.6, 0]}>
        {Vignette ? <Vignette color={feature.color} animate={animate} /> : null}
      </group>
      {/* name tag, always facing the camera */}
      <sprite position={[0, 4.7, 0]} scale={[labelAspect * 0.85, 0.85, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

type ExhibitsProps = {
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
  readonly activeIdRef: RefObject<string | null>;
};

/** Every feature booth in the city, one per landmark. */
export default function Exhibits({ playerRef, prefersReduced, activeIdRef }: ExhibitsProps) {
  return (
    <group>
      {EXHIBITS.map((exhibit) => (
        <Exhibit
          key={exhibit.featureId}
          exhibit={exhibit}
          playerRef={playerRef}
          prefersReduced={prefersReduced}
          activeIdRef={activeIdRef}
        />
      ))}
    </group>
  );
}
