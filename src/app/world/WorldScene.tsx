"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RefObject } from "react";
import type { PlayerState } from "@/types/world";
import { directionFromKeys } from "@/lib/world/input";
import { stepPlayer } from "@/lib/world/movement";
import { COLLIDERS, SPAWN } from "@/lib/world/cityLayout";
import { EXHIBITS } from "@/lib/world/exhibits";
import { nearestExhibit } from "@/lib/world/proximity";
import type { JoystickState, PlayerSnapshot } from "./refs";
import Player from "./Player";
import CityScene from "./CityScene";
import Landmarks from "./Landmarks";
import Exhibits from "./Exhibits";

// Third-person chase offset, Mario-Galaxy flavoured: high, pulled back, with a
// soft positional lag and a slight look-ahead in the direction of travel.
const CAMERA_OFFSET = { x: 0, y: 10.5, z: 12.5 };
const CAMERA_LAG = 4.5;
const LOOK_AHEAD = 0.35;

export type WorldSceneProps = {
  readonly keysRef: RefObject<Set<string>>;
  readonly joystickRef: RefObject<JoystickState>;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
  readonly onActiveExhibit: (featureId: string | null) => void;
};

/**
 * Owns the per-frame game loop: reads input, advances the pure movement core,
 * poses the avatar, chases with the camera, and reports which exhibit the
 * player is standing at. All simulation math lives in src/lib/world — this
 * component is just the imperative shell around it.
 */
export default function WorldScene({
  keysRef,
  joystickRef,
  playerRef,
  prefersReduced,
  onActiveExhibit,
}: WorldSceneProps) {
  const outerRef = useRef<Group>(null);
  const bobRef = useRef<Group>(null);
  const stateRef = useRef<PlayerState>({
    position: { x: SPAWN.x, z: SPAWN.z },
    velocity: { x: 0, z: 0 },
    heading: Math.PI,
  });
  const activeIdRef = useRef<string | null>(null);
  const walkPhaseRef = useRef(0);

  useFrame(({ camera }, dt) => {
    const keys = directionFromKeys(keysRef.current ?? new Set());
    const joystick = joystickRef.current ?? { x: 0, z: 0 };
    const usingKeys = keys.x !== 0 || keys.z !== 0;
    const input = usingKeys ? keys : { x: joystick.x, z: joystick.z, running: false };

    const next = stepPlayer({
      state: stateRef.current,
      input,
      cameraYaw: 0,
      colliders: COLLIDERS,
      dt,
    });
    stateRef.current = next;

    const speed = Math.hypot(next.velocity.x, next.velocity.z);
    const outer = outerRef.current;
    if (outer) {
      outer.position.set(next.position.x, 0, next.position.z);
      outer.rotation.y = next.heading;
    }
    const bob = bobRef.current;
    if (bob) {
      walkPhaseRef.current += dt * (4 + speed * 1.6);
      const stride = prefersReduced ? 0 : Math.min(speed / 7, 1);
      bob.position.y = Math.abs(Math.sin(walkPhaseRef.current)) * 0.09 * stride;
      bob.rotation.x = 0.1 * stride;
      bob.rotation.z = Math.sin(walkPhaseRef.current) * 0.05 * stride;
    }

    if (playerRef.current) {
      playerRef.current.x = next.position.x;
      playerRef.current.z = next.position.z;
      playerRef.current.heading = next.heading;
    }

    const targetX = next.position.x + next.velocity.x * LOOK_AHEAD;
    const targetZ = next.position.z + next.velocity.z * LOOK_AHEAD;
    const blend = 1 - Math.exp(-CAMERA_LAG * dt);
    camera.position.x += (targetX + CAMERA_OFFSET.x - camera.position.x) * blend;
    camera.position.y += (CAMERA_OFFSET.y - camera.position.y) * blend;
    camera.position.z += (targetZ + CAMERA_OFFSET.z - camera.position.z) * blend;
    camera.lookAt(camera.position.x, 1.8, camera.position.z - CAMERA_OFFSET.z - 1);

    const nearest = nearestExhibit(next.position, EXHIBITS);
    const nearestId = nearest?.featureId ?? null;
    if (nearestId !== activeIdRef.current) {
      activeIdRef.current = nearestId;
      onActiveExhibit(nearestId);
    }
  });

  return (
    <>
      <hemisphereLight args={["#33497a", "#141926", 1.3]} />
      <directionalLight position={[40, 60, -30]} intensity={1.2} color="#9db8e8" />
      <ambientLight intensity={0.4} color="#55668c" />
      <CityScene prefersReduced={prefersReduced} />
      <Landmarks prefersReduced={prefersReduced} />
      <Exhibits playerRef={playerRef} prefersReduced={prefersReduced} activeIdRef={activeIdRef} />
      <Player outerRef={outerRef} bobRef={bobRef} />
    </>
  );
}
