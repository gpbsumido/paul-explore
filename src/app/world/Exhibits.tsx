"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { EXHIBITS } from "@/lib/world/exhibits";
import { FEATURES } from "@/app/_shared/featureData.data";
import type { WorldExhibit } from "@/types/world";
import type { PlayerSnapshot } from "./refs";
import { useSegments } from "./detail";
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

function Exhibit({
  exhibit,
  playerRef,
  prefersReduced,
  activeIdRef,
}: ExhibitProps) {
  const feature = FEATURES.find((f) => f.id === exhibit.featureId);
  const round = useSegments(36);
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
        isActive && !prefersReduced
          ? 1 + Math.sin(clock.elapsedTime * 5) * 0.06
          : 1;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
    if (beaconRef.current) {
      beaconRef.current.opacity = isActive ? 0.22 : 0.09;
    }
    if (floatRef.current && animate()) {
      floatRef.current.position.y =
        2.6 + Math.sin(clock.elapsedTime * 1.1) * 0.12;
      floatRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25;
    }
  });

  if (!feature) return null;
  const Vignette = VIGNETTES[exhibit.featureId];
  const featured = !!exhibit.featured;
  const footprint = featured ? 1.55 : 1;

  return (
    <group position={[exhibit.position.x, 0, exhibit.position.z]}>
      {/* glowing ground ring — floats above the road layer so it never z-fights */}
      <group scale={[footprint, 1, footprint]}>
        <mesh
          ref={ringRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.08, 0]}
        >
          <ringGeometry args={[1.15, 1.55, round]} />
          <meshBasicMaterial
            color={feature.color}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
          <circleGeometry args={[1.15, round]} />
          <meshBasicMaterial
            color={feature.color}
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
        {/* light beam */}
        <mesh position={[0, 4.5, 0]}>
          <cylinderGeometry
            args={[0.55, 1.1, 9, Math.ceil(round / 2), 1, true]}
          />
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
      </group>
      {/* the main exhibition gets a gateway banner */}
      {featured && (
        <group>
          {[-3.2, 3.2].map((px) => (
            <mesh key={px} position={[px, 1.8, 0]}>
              <cylinderGeometry args={[0.09, 0.12, 3.6, 10]} />
              <meshStandardMaterial color="#2a303c" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 3.55, 0]}>
            <boxGeometry args={[7.2, 0.75, 0.12]} />
            <meshStandardMaterial
              color={feature.color}
              emissive={feature.color}
              emissiveIntensity={0.6}
              roughness={0.4}
            />
          </mesh>
        </group>
      )}
      {/* floating diorama */}
      <group ref={floatRef} position={[0, 2.6, 0]} scale={featured ? 1.35 : 1}>
        {Vignette ? <Vignette color={feature.color} animate={animate} /> : null}
      </group>
      {/* name tag, always facing the camera */}
      <sprite
        position={[0, featured ? 5.4 : 4.7, 0]}
        scale={[
          labelAspect * (featured ? 1.1 : 0.85),
          featured ? 1.1 : 0.85,
          1,
        ]}
      >
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
export default function Exhibits({
  playerRef,
  prefersReduced,
  activeIdRef,
}: ExhibitsProps) {
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
