"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RefObject } from "react";
import type { MoveInput, PlayerState, Vec2 } from "@/types/world";
import { directionFromKeys } from "@/lib/world/input";
import { stepPlayer, WALK_SPEED } from "@/lib/world/movement";
import { COLLIDERS, OCCLUDERS, SPAWN } from "@/lib/world/cityLayout";
import { visibleFraction } from "@/lib/world/camera";
import { EXHIBITS } from "@/lib/world/exhibits";
import { nearestExhibit, INTERACT_RADIUS } from "@/lib/world/proximity";
import { routeWaypoints } from "@/lib/world/routing";
import {
  recordSample,
  type GhostPath,
  type GhostPoint,
} from "@/lib/world/ghost";
import { pushTrailPoint, type TrailPoint } from "@/lib/world/trail";
import { findCollectible, markVisited } from "@/lib/world/collectibles";
import {
  streetcarAt,
  nearestStop,
  carIsAtStop,
  landsOnRoof,
  isOverCarRoof,
  ROOF_HEIGHT,
  RIDE_OFFSET,
} from "@/lib/world/transit";
import { reachHeight } from "@/lib/world/unlocks";
import { ambienceMix, footstepInterval } from "@/lib/world/soundscape";
import type { WorldAudio } from "./audio/engine";
import { LANDMARKS } from "@/lib/world/cityLayout";
import type { Season } from "@/lib/world/seasons";
import { SEASON_DRESSING } from "@/lib/world/seasons";
import type { WeatherCondition } from "@/hooks/useWeather";
import Weather from "./Weather";
import GhostPlayer from "./GhostPlayer";
import Collectibles from "./Collectibles";
import Raccoons from "./Raccoons";
import Trail from "./Trail";
import RemoteExplorers from "./RemoteExplorers";
import type { PeerMeta, PeerState } from "./presence/useWorldPresence";
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

// Guided walk to an exhibit: the explorer runs there at a speed a player
// could manage themselves, veering when it gets wedged on a corner.
const AUTO_SPEED_SCALE = 1;
const STUCK_SPEED = 1.5;
const STUCK_AFTER = 0.35;

// How close to the tower's foot you must stand to take the elevator up.
const TOWER_RADIUS = 6;
// Where the observation-deck camera sits, and what it looks at.
const DECK_HEIGHT = 46;
const DECK_PULLBACK = 26;
// Riders stand on the car's running board, a step above the street.
const RIDE_HEIGHT = 0.3;

/** What pressing E would do from where the player is standing. */
export type InteractionKind =
  "exhibit" | "board" | "alight" | "lookout" | "descend" | null;

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
  // This visit's stroll, sampled by the loop; the page persists it.
  readonly recordingRef: RefObject<readonly GhostPoint[]>;
  // A previous stroll (or the generated tour) to haunt the city with.
  readonly ghostPath: GhostPath | null;
  // Live visitors, if any — when someone real is here, the ghost stays home.
  readonly peers: readonly PeerMeta[];
  readonly peersRef: RefObject<Map<string, PeerState>>;
  // The collectathon: what's been found, who to tell about a new find, and
  // the exploration fog bookkeeping.
  readonly collected: readonly string[];
  readonly collectedRef: RefObject<readonly string[]>;
  readonly onCollect: (id: string) => void;
  readonly visitedRef: RefObject<readonly string[]>;
  readonly onExplore: (visited: readonly string[]) => void;
  readonly season: Season;
  // Set true by the page when E is pressed; the scene decides what it means.
  readonly interactRef: RefObject<boolean>;
  readonly onVisitExhibit: (featureId: string) => void;
  // What E would do right now, for the HUD prompt.
  readonly onInteractionChange: (
    kind: InteractionKind,
    label: string | null,
    key?: string,
  ) => void;
  readonly onRideChange: (riding: boolean) => void;
  readonly onLookoutChange: (active: boolean) => void;
  // Set by the lookout panel to warp the explorer to an exhibit.
  readonly teleportRef: RefObject<Vec2 | null>;
  // Photo mode: free orbit around the explorer, HUD out of the way.
  readonly photoMode: boolean;
  // Flipped true by the shutter; the scene renders and hands back a PNG.
  readonly captureRef: RefObject<boolean>;
  readonly onCapture: (dataUrl: string) => void;
  readonly condition: WeatherCondition;
  // The synthesised soundscape, once the visitor has interacted.
  readonly audioRef: RefObject<WorldAudio | null>;
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
  recordingRef,
  ghostPath,
  peers,
  peersRef,
  collected,
  collectedRef,
  onCollect,
  visitedRef,
  onExplore,
  season,
  interactRef,
  onVisitExhibit,
  onInteractionChange,
  onRideChange,
  onLookoutChange,
  teleportRef,
  photoMode,
  captureRef,
  onCapture,
  condition,
  audioRef,
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
  const routeRef = useRef<{
    forId: string;
    waypoints: readonly Vec2[];
    leg: number;
  } | null>(null);
  const trailRef = useRef<readonly TrailPoint[]>([]);
  const camFractionRef = useRef(1);
  const ridingRef = useRef(false);
  // Riding on the roof is a separate, sillier thing from riding the board:
  // you get there by jumping, and you keep your footing wherever you landed.
  const roofRef = useRef<{ riding: boolean; offsetX: number; offsetZ: number }>(
    {
      riding: false,
      offsetX: 0,
      offsetZ: 0,
    },
  );
  const lookoutRef = useRef(false);
  const interactionRef = useRef<InteractionKind>(null);
  const photoOrbitRef = useRef({ yaw: 0, pitch: 0.5, distance: 12 });
  const stepClockRef = useRef(0);
  const airborneRef = useRef(false);

  useFrame(({ camera, clock, gl, scene }, dt) => {
    // Photo mode: park the simulation and fly the camera around the explorer.
    if (photoMode) {
      const held = keysRef.current ?? new Set();
      const orbit = photoOrbitRef.current;
      const turn = (held.has("KeyD") ? 1 : 0) - (held.has("KeyA") ? 1 : 0);
      const dolly = (held.has("KeyS") ? 1 : 0) - (held.has("KeyW") ? 1 : 0);
      const lift =
        (held.has("Space") ? 1 : 0) -
        (held.has("ShiftLeft") || held.has("ShiftRight") ? 1 : 0);
      orbit.yaw += turn * 1.4 * dt;
      orbit.distance = Math.min(
        Math.max(orbit.distance + dolly * 14 * dt, 3),
        60,
      );
      orbit.pitch = Math.min(
        Math.max(orbit.pitch + lift * 0.9 * dt, -0.2),
        1.35,
      );

      const focus = stateRef.current.position;
      camera.position.set(
        focus.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance,
        1.4 + Math.sin(orbit.pitch) * orbit.distance,
        focus.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance,
      );
      camera.lookAt(focus.x, 1.2, focus.z);

      if (captureRef.current) {
        captureRef.current = false;
        // Render synchronously so the buffer is still there to read back.
        gl.render(scene, camera);
        onCapture(gl.domElement.toDataURL("image/png"));
      }
      return;
    }
    if (captureRef.current) {
      captureRef.current = false;
      gl.render(scene, camera);
      onCapture(gl.domElement.toDataURL("image/png"));
    }
    const state = stateRef.current;
    const keys = directionFromKeys(keysRef.current ?? new Set());
    const joystick = joystickRef.current ?? { x: 0, z: 0 };
    const userMoving =
      keys.x !== 0 ||
      keys.z !== 0 ||
      keys.jump ||
      joystick.x !== 0 ||
      joystick.z !== 0;

    // Fast travel from the tower lookout drops the explorer at a booth.
    const warp = teleportRef.current;
    if (warp) {
      teleportRef.current = null;
      stateRef.current = {
        position: { x: warp.x, z: warp.z },
        velocity: { x: 0, z: 0 },
        heading: Math.PI,
        y: 0,
        vy: 0,
      };
      ridingRef.current = false;
      roofRef.current = { riding: false, offsetX: 0, offsetZ: 0 };
      lookoutRef.current = false;
      onRideChange(false);
      onLookoutChange(false);
      trailRef.current = [];
      return;
    }

    const car = streetcarAt(clock.elapsedTime);

    // Context-sensitive E: get off the car, come down from the tower, board a
    // passing 501, ride the elevator up, or visit the exhibit you're standing at.
    if (interactRef.current) {
      interactRef.current = false;
      if (ridingRef.current) {
        ridingRef.current = false;
        onRideChange(false);
        stateRef.current = {
          position: { x: car.x, z: car.z + RIDE_OFFSET - 1.4 },
          velocity: { x: 0, z: 0 },
          heading: Math.PI,
          y: 0,
          vy: 0,
        };
      } else if (lookoutRef.current) {
        lookoutRef.current = false;
        onLookoutChange(false);
      } else {
        const tower = LANDMARKS.cnTower;
        const atTower =
          Math.hypot(state.position.x - tower.x, state.position.z - tower.z) <
          TOWER_RADIUS;
        const stop = nearestStop(state.position);
        const carIsHere = stop ? carIsAtStop(car, stop) : false;
        if (atTower) {
          lookoutRef.current = true;
          onLookoutChange(true);
        } else if (stop && carIsHere) {
          ridingRef.current = true;
          onRideChange(true);
        } else if (activeIdRef.current) {
          onVisitExhibit(activeIdRef.current);
        }
      }
    }

    // Roof riding: keep your footing where you landed, jump to get off.
    if (roofRef.current.riding) {
      const roof = roofRef.current;
      const stillAboard = isOverCarRoof(
        { x: car.x + roof.offsetX, z: car.z + roof.offsetZ },
        car,
      );
      const jumpedOff = keys.jump;
      if (!stillAboard || jumpedOff) {
        roof.riding = false;
        onRideChange(false);
        stateRef.current = {
          position: { x: car.x + roof.offsetX, z: car.z + roof.offsetZ },
          velocity: { x: jumpedOff ? car.direction * 6 : 0, z: 0 },
          heading: stateRef.current.heading,
          y: ROOF_HEIGHT,
          vy: jumpedOff ? 9 : 0,
        };
      } else {
        const onRoof: PlayerState = {
          position: { x: car.x + roof.offsetX, z: car.z + roof.offsetZ },
          velocity: { x: car.dwelling ? 0 : car.direction * 9, z: 0 },
          heading: stateRef.current.heading,
          y: ROOF_HEIGHT,
          vy: 0,
        };
        stateRef.current = onRoof;
        const outerRoof = outerRef.current;
        if (outerRoof) {
          outerRoof.position.set(
            onRoof.position.x,
            ROOF_HEIGHT,
            onRoof.position.z,
          );
          outerRoof.rotation.y = onRoof.heading;
        }
        motionRef.current.stride = 0;
        motionRef.current.air = 0;
        if (playerRef.current) {
          playerRef.current.x = onRoof.position.x;
          playerRef.current.z = onRoof.position.z;
          playerRef.current.heading = onRoof.heading;
        }
        const anchorRoof = {
          x: onRoof.position.x,
          y: ROOF_HEIGHT + 1.4,
          z: onRoof.position.z,
        };
        const blendRoof = 1 - Math.exp(-CAMERA_LAG * dt);
        camera.position.x +=
          (anchorRoof.x + CAMERA_OFFSET.x - camera.position.x) * blendRoof;
        camera.position.y +=
          (CAMERA_OFFSET.y + 2 - camera.position.y) * blendRoof;
        camera.position.z +=
          (anchorRoof.z + CAMERA_OFFSET.z - camera.position.z) * blendRoof;
        camera.lookAt(anchorRoof.x, anchorRoof.y, anchorRoof.z);
        if (interactionRef.current !== "alight") {
          interactionRef.current = "alight";
          onInteractionChange("alight", "to get off the roof", "Space");
        }
        return;
      }
    }

    // Riding: the explorer is carried by the car until they hop off.
    if (ridingRef.current) {
      const riding: PlayerState = {
        position: { x: car.x, z: car.z + RIDE_OFFSET },
        velocity: { x: car.direction * 9, z: 0 },
        heading: car.direction > 0 ? Math.PI / 2 : -Math.PI / 2,
        y: RIDE_HEIGHT,
        vy: 0,
      };
      stateRef.current = riding;
      const outerRiding = outerRef.current;
      if (outerRiding) {
        outerRiding.position.set(
          riding.position.x,
          riding.y,
          riding.position.z,
        );
        outerRiding.rotation.y = riding.heading;
      }
      motionRef.current.stride = 0;
      motionRef.current.air = 0;
      if (playerRef.current) {
        playerRef.current.x = riding.position.x;
        playerRef.current.z = riding.position.z;
        playerRef.current.heading = riding.heading;
      }
      const anchorRide = { x: riding.position.x, y: 2.6, z: riding.position.z };
      const blendRide = 1 - Math.exp(-CAMERA_LAG * dt);
      camera.position.x +=
        (anchorRide.x + CAMERA_OFFSET.x - camera.position.x) * blendRide;
      camera.position.y += (CAMERA_OFFSET.y - camera.position.y) * blendRide;
      camera.position.z +=
        (anchorRide.z + CAMERA_OFFSET.z - camera.position.z) * blendRide;
      camera.lookAt(anchorRide.x, anchorRide.y, anchorRide.z);
      if (interactionRef.current !== "alight") {
        interactionRef.current = "alight";
        onInteractionChange("alight", "hop off the 501");
      }
      return;
    }

    // Up the tower: the city laid out below, movement parked.
    if (lookoutRef.current) {
      const tower = LANDMARKS.cnTower;
      const blendUp = 1 - Math.exp(-1.8 * dt);
      camera.position.x += (tower.x - camera.position.x) * blendUp;
      camera.position.y += (DECK_HEIGHT - camera.position.y) * blendUp;
      camera.position.z +=
        (tower.z + DECK_PULLBACK - camera.position.z) * blendUp;
      camera.lookAt(0, 0, -6);
      if (interactionRef.current !== "descend") {
        interactionRef.current = "descend";
        onInteractionChange("descend", "take the elevator down");
      }
      return;
    }

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
          stuckForRef.current =
            speed < STUCK_SPEED ? stuckForRef.current + dt : 0;
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

    // Come down on top of a passing streetcar and you've earned the ride.
    if (
      !ridingRef.current &&
      landsOnRoof(next.position, next.y, next.vy, car)
    ) {
      roofRef.current = {
        riding: true,
        offsetX: next.position.x - car.x,
        offsetZ: next.position.z - car.z,
      };
      onRideChange(true);
    }

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
      bob.position.y = grounded
        ? Math.abs(Math.sin(walkPhaseRef.current)) * 0.07 * stride
        : 0;
      bob.rotation.x = 0.08 * stride;
      bob.rotation.z = grounded
        ? Math.sin(walkPhaseRef.current) * 0.04 * stride
        : 0;
    }

    if (playerRef.current) {
      playerRef.current.x = next.position.x;
      playerRef.current.z = next.position.z;
      playerRef.current.heading = next.heading;
    }
    if (recordingRef.current) {
      recordingRef.current = recordSample(recordingRef.current, {
        x: next.position.x,
        z: next.position.z,
        t: clock.elapsedTime,
      });
    }
    // The wake only grows while actually moving; standing still lets it fade.
    if (!prefersReduced && speed > 1) {
      trailRef.current = pushTrailPoint(trailRef.current, {
        x: next.position.x,
        z: next.position.z,
        t: clock.elapsedTime,
      });
    }

    // Soundscape: the mix follows the player, footsteps follow their stride.
    const audio = audioRef.current;
    if (audio) {
      audio.setMix(
        ambienceMix({ player: next.position, carX: car.x, condition }),
      );
      const grounded = next.y <= 0.01;
      const interval = grounded ? footstepInterval(speed) : null;
      if (interval === null) {
        stepClockRef.current = 0;
      } else {
        stepClockRef.current += dt;
        if (stepClockRef.current >= interval) {
          stepClockRef.current = 0;
          audio.footstep();
        }
      }
      if (!grounded && !airborneRef.current) audio.jump();
      airborneRef.current = !grounded;
    }

    const found = findCollectible(
      next.position,
      next.y,
      collectedRef.current ?? [],
      reachHeight(outfit.id),
    );
    if (found) {
      audio?.chime();
      onCollect(found.id);
    }
    if (visitedRef.current) {
      const explored = markVisited(visitedRef.current, next.position);
      if (explored !== visitedRef.current) {
        visitedRef.current = explored;
        onExplore(explored);
      }
    }

    // Chase camera: frame the player from a boom that shortens whenever a
    // building would stand in the way, so the explorer is never lost behind a
    // tower. Pulling in is quick, easing back out is gentle.
    const anchor = {
      x: next.position.x + next.velocity.x * LOOK_AHEAD,
      y: 1.8 + next.y * 0.5,
      z: next.position.z + next.velocity.z * LOOK_AHEAD,
    };
    const desired = {
      x: anchor.x + CAMERA_OFFSET.x,
      y: CAMERA_OFFSET.y + next.y * 0.5,
      z: anchor.z + CAMERA_OFFSET.z,
    };
    const clearFraction = visibleFraction(anchor, desired, OCCLUDERS);
    const previousFraction = camFractionRef.current;
    const settleRate = clearFraction < previousFraction ? 18 : 3;
    camFractionRef.current =
      previousFraction +
      (clearFraction - previousFraction) * (1 - Math.exp(-settleRate * dt));
    const boom = camFractionRef.current;

    const blend = 1 - Math.exp(-CAMERA_LAG * dt);
    camera.position.x +=
      (anchor.x + (desired.x - anchor.x) * boom - camera.position.x) * blend;
    camera.position.y +=
      (anchor.y + (desired.y - anchor.y) * boom - camera.position.y) * blend;
    camera.position.z +=
      (anchor.z + (desired.z - anchor.z) * boom - camera.position.z) * blend;
    camera.lookAt(anchor.x, anchor.y, anchor.z);

    const nearest = nearestExhibit(next.position, EXHIBITS);
    const nearestId = nearest?.featureId ?? null;
    if (nearestId !== activeIdRef.current) {
      activeIdRef.current = nearestId;
      onActiveExhibit(nearestId);
    }

    // Tell the HUD what E would do from here.
    const tower = LANDMARKS.cnTower;
    const atTower =
      Math.hypot(next.position.x - tower.x, next.position.z - tower.z) <
      TOWER_RADIUS;
    const stop = nearestStop(next.position);
    const carIsHere = stop ? carIsAtStop(car, stop) : false;
    const kind: InteractionKind = atTower
      ? "lookout"
      : stop && carIsHere
        ? "board"
        : nearestId
          ? "exhibit"
          : null;
    if (kind !== interactionRef.current) {
      interactionRef.current = kind;
      onInteractionChange(
        kind,
        kind === "lookout"
          ? "ride up the CN Tower"
          : kind === "board"
            ? `board the 501 at ${stop?.name ?? "the stop"}`
            : null,
      );
    }
  });

  return (
    <>
      <hemisphereLight
        args={[
          preset.hemisphere[0],
          preset.hemisphere[1],
          preset.hemisphere[2],
        ]}
      />
      <directionalLight
        position={[...preset.sun.position]}
        intensity={preset.sun.intensity}
        color={preset.sun.color}
      />
      <ambientLight
        intensity={preset.ambient.intensity}
        color={preset.ambient.color}
      />
      <CityScene
        prefersReduced={prefersReduced}
        preset={preset}
        season={season}
      />
      <Landmarks
        prefersReduced={prefersReduced}
        preset={preset}
        festive={SEASON_DRESSING[season].festive}
      />
      <Raccoons playerRef={playerRef} prefersReduced={prefersReduced} />
      <Weather condition={condition} prefersReduced={prefersReduced} />
      <Exhibits
        playerRef={playerRef}
        prefersReduced={prefersReduced}
        activeIdRef={activeIdRef}
      />
      {ghostPath && !prefersReduced && peers.length === 0 && (
        <GhostPlayer path={ghostPath} />
      )}
      {!prefersReduced && <Trail pointsRef={trailRef} color={outfit.accent} />}
      <Collectibles
        collected={collected}
        playerRef={playerRef}
        prefersReduced={prefersReduced}
      />
      <RemoteExplorers peers={peers} peersRef={peersRef} />
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
