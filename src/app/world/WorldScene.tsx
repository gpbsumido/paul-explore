"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RefObject } from "react";
import type { MoveInput, PlayerState, Vec2 } from "@/types/world";
import { directionFromKeys } from "@/lib/world/input";
import { stepPlayer, WALK_SPEED } from "@/lib/world/movement";
import { COLLIDERS, SPAWN } from "@/lib/world/cityLayout";
import { EXHIBITS } from "@/lib/world/exhibits";
import { nearestExhibit, INTERACT_RADIUS } from "@/lib/world/proximity";
import { routeWaypoints } from "@/lib/world/routing";
import { resolveColliders } from "@/lib/world/colliders";
import type { JoystickState, PlayerSnapshot } from "./refs";
import type { SkyPreset } from "./skyPresets";
import type { Outfit } from "./outfits";
import Player, { type PlayerMotion } from "./Player";
import CityScene from "./CityScene";
import Landmarks from "./Landmarks";
import Exhibits from "./Exhibits";

// Third-person chase offset, Mario-Galaxy flavoured: high, pulled back, with a
// soft positional lag and a slight look-ahead in the direction of travel.
const CAMERA_OFFSET = { x: 0, y: 10.5, z: 12.5 };
const CAMERA_LAG = 4.5;
const LOOK_AHEAD = 0.35;

// Exhibit speedrun: run at this multiple of top run speed, veer when stuck.
const AUTO_SPEED_SCALE = 2.2;
const STUCK_SPEED = 1.5;
const STUCK_AFTER = 0.35;

export type WorldSceneProps = {
  readonly keysRef: RefObject<Set<string>>;
  readonly joystickRef: RefObject<JoystickState>;
  readonly playerRef: RefObject<PlayerSnapshot>;
  readonly prefersReduced: boolean;
  readonly onActiveExhibit: (featureId: string | null) => void;
  readonly preset: SkyPreset;
  readonly outfit: Outfit;
  // Feature id to auto-run to; the scene clears it and reports the outcome.
  readonly autoTargetRef: RefObject<string | null>;
  readonly onAutoRunEnd: (featureId: string, arrived: boolean) => void;
};

const rotate = (input: MoveInput, angle: number): MoveInput => ({
  ...input,
  x: input.x * Math.cos(angle) + input.z * Math.sin(angle),
  z: -input.x * Math.sin(angle) + input.z * Math.cos(angle),
});

/**
 * Owns the per-frame game loop: reads input (or drives the exhibit speedrun),
 * advances the pure movement core, poses the avatar, chases with the camera,
 * and reports which exhibit the player is standing at. All simulation math
 * lives in src/lib/world — this component is just the imperative shell.
 */
export default function WorldScene({
  keysRef,
  joystickRef,
  playerRef,
  prefersReduced,
  onActiveExhibit,
  preset,
  outfit,
  autoTargetRef,
  onAutoRunEnd,
}: WorldSceneProps) {
  const outerRef = useRef<Group>(null);
  const bobRef = useRef<Group>(null);
  const motionRef = useRef<PlayerMotion>({ phase: 0, stride: 0, air: 0 });
  const stateRef = useRef<PlayerState>({
    position: { x: SPAWN.x, z: SPAWN.z },
    velocity: { x: 0, z: 0 },
    heading: Math.PI,
    y: 0,
    vy: 0,
  });
  const activeIdRef = useRef<string | null>(null);
  const walkPhaseRef = useRef(0);
  const stuckForRef = useRef(0);
  const routeRef = useRef<{ forId: string; waypoints: readonly Vec2[]; leg: number } | null>(null);

  useFrame(({ camera }, dt) => {
    const state = stateRef.current;
    const keys = directionFromKeys(keysRef.current ?? new Set());
    const joystick = joystickRef.current ?? { x: 0, z: 0 };
    const userMoving =
      keys.x !== 0 || keys.z !== 0 || keys.jump || joystick.x !== 0 || joystick.z !== 0;

    // Exhibit speedrun: steer straight at the target, veer along walls when
    // wedged, and hand control back the moment the user touches anything.
    const autoId = autoTargetRef.current;
    let input: MoveInput =
      keys.x !== 0 || keys.z !== 0 || keys.jump
        ? keys
        : { x: joystick.x, z: joystick.z, running: false, jump: false };
    let speedScale = 1;

    if (autoId) {
      const target = EXHIBITS.find((e) => e.featureId === autoId);
      if (!target || userMoving) {
        autoTargetRef.current = null;
        routeRef.current = null;
        stuckForRef.current = 0;
        if (target) onAutoRunEnd(autoId, false);
      } else {
        const distanceToTarget = Math.hypot(
          target.position.x - state.position.x,
          target.position.z - state.position.z,
        );
        if (distanceToTarget < INTERACT_RADIUS * 0.6) {
          autoTargetRef.current = null;
          routeRef.current = null;
          stuckForRef.current = 0;
          onAutoRunEnd(autoId, true);
        } else {
          // Plan a street route once per run, then chase waypoints.
          if (routeRef.current?.forId !== autoId) {
            routeRef.current = {
              forId: autoId,
              waypoints: routeWaypoints(state.position, target.position),
              leg: 0,
            };
          }
          const route = routeRef.current;
          const waypoint = route.waypoints[route.leg];
          const dx = waypoint.x - state.position.x;
          const dz = waypoint.z - state.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < 2.5 && route.leg < route.waypoints.length - 1) {
            route.leg += 1;
          }
          const speed = Math.hypot(state.velocity.x, state.velocity.z);
          stuckForRef.current = speed < STUCK_SPEED ? stuckForRef.current + dt : 0;
          input = {
            x: distance > 0 ? dx / distance : 0,
            z: distance > 0 ? dz / distance : 0,
            running: true,
            jump: false,
          };
          if (stuckForRef.current > STUCK_AFTER) input = rotate(input, 0.9);
          speedScale = AUTO_SPEED_SCALE;
        }
      }
    }

    const next = stepPlayer({
      state,
      input,
      cameraYaw: 0,
      colliders: COLLIDERS,
      dt,
      speedScale,
    });
    stateRef.current = next;

    const speed = Math.hypot(next.velocity.x, next.velocity.z);
    const outer = outerRef.current;
    if (outer) {
      outer.position.set(next.position.x, next.y, next.position.z);
      outer.rotation.y = next.heading;
    }
    const stride = prefersReduced ? 0 : Math.min(speed / WALK_SPEED, 1);
    walkPhaseRef.current += dt * (4 + speed * 1.4);
    motionRef.current.phase = walkPhaseRef.current;
    motionRef.current.stride = stride;
    motionRef.current.air = next.y;
    const bob = bobRef.current;
    if (bob) {
      const grounded = next.y <= 0.01;
      bob.position.y = grounded ? Math.abs(Math.sin(walkPhaseRef.current)) * 0.07 * stride : 0;
      bob.rotation.x = 0.08 * stride;
      bob.rotation.z = grounded ? Math.sin(walkPhaseRef.current) * 0.04 * stride : 0;
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
    camera.position.y += (CAMERA_OFFSET.y + next.y * 0.5 - camera.position.y) * blend;
    camera.position.z += (targetZ + CAMERA_OFFSET.z - camera.position.z) * blend;
    // Keep the camera out of building interiors — treat it as a fat circle
    // against the same footprints the player collides with.
    const clearCam = resolveColliders(
      { x: camera.position.x, z: camera.position.z },
      1,
      COLLIDERS,
    );
    camera.position.x = clearCam.x;
    camera.position.z = clearCam.z;
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
      <hemisphereLight
        args={[preset.hemisphere[0], preset.hemisphere[1], preset.hemisphere[2]]}
      />
      <directionalLight
        position={[...preset.sun.position]}
        intensity={preset.sun.intensity}
        color={preset.sun.color}
      />
      <ambientLight intensity={preset.ambient.intensity} color={preset.ambient.color} />
      <CityScene prefersReduced={prefersReduced} preset={preset} />
      <Landmarks prefersReduced={prefersReduced} preset={preset} />
      <Exhibits playerRef={playerRef} prefersReduced={prefersReduced} activeIdRef={activeIdRef} />
      <Player
        outerRef={outerRef}
        bobRef={bobRef}
        motionRef={motionRef}
        lantern={preset.lantern}
        outfit={outfit}
      />
    </>
  );
}
