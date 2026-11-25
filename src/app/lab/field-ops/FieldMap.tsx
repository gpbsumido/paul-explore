"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ACCENT_BAND } from "@/lib/accentBand";
import type { FieldOpsTrack } from "@/lib/field-ops/types";

const METERS_PER_SCENE_UNIT = 100;
const SMOOTHING_PER_SECOND = 6;

type FieldMapProps = {
  tracks: FieldOpsTrack[];
  staleTrackIds: ReadonlySet<string>;
  selectedTrackId: string | null;
};

function TrackMarker({
  track,
  isStale,
  isSelected,
}: {
  track: FieldOpsTrack;
  isStale: boolean;
  isSelected: boolean;
}) {
  const markerRef = useRef<THREE.Group>(null);
  // Updates arrive once a second; easing toward them keeps the map smooth
  // without re-rendering React every frame.
  useFrame((_, deltaSeconds) => {
    const marker = markerRef.current;
    if (!marker) return;
    const target = new THREE.Vector3(
      track.eastMeters / METERS_PER_SCENE_UNIT,
      track.altitudeMeters / METERS_PER_SCENE_UNIT,
      -track.northMeters / METERS_PER_SCENE_UNIT,
    );
    marker.position.lerp(target, 1 - Math.exp(-SMOOTHING_PER_SECOND * deltaSeconds));
  });

  const color = isStale ? ACCENT_BAND.gold : isSelected ? ACCENT_BAND.azure : ACCENT_BAND.teal;
  return (
    <group ref={markerRef}>
      {/* Shape says what it is, so colour is never the only signal. */}
      <mesh>
        {track.kind === "vehicle" && <boxGeometry args={[0.3, 0.2, 0.3]} />}
        {track.kind === "aircraft" && <coneGeometry args={[0.2, 0.45, 4]} />}
        {track.kind === "vessel" && <octahedronGeometry args={[0.25]} />}
        <meshStandardMaterial color={color} wireframe={isStale} />
      </mesh>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.46, 32]} />
          <meshBasicMaterial color={ACCENT_BAND.azure} />
        </mesh>
      )}
    </group>
  );
}

/** The 3D picture. The track list beside it carries the same information as text. */
export default function FieldMap({ tracks, staleTrackIds, selectedTrackId }: FieldMapProps) {
  return (
    <Canvas camera={{ position: [0, 9, 11], fov: 50 }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <gridHelper args={[16, 16]} />
      {tracks.map((track) => (
        <TrackMarker
          key={track.id}
          track={track}
          isStale={staleTrackIds.has(track.id)}
          isSelected={track.id === selectedTrackId}
        />
      ))}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
