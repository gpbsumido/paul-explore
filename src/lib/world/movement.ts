import type { MoveInput, PlayerState, RectCollider, Vec2 } from "@/types/world";
import { resolveColliders } from "./colliders";

export const PLAYER_RADIUS = 0.55;
export const WALK_SPEED = 10;
export const RUN_MULTIPLIER = 1.8;

// Exponential smoothing rates (per second). Higher = snappier.
const ACCEL_RATE = 10;
const TURN_RATE = 12;

// Jump tuning: v²/2g puts the apex a bit over two units up.
const GRAVITY = 34;
const JUMP_SPEED = 13;

// Above this dt the browser was almost certainly backgrounded; integrating it
// would teleport the player, so treat it as a single normal frame.
const MAX_DT = 1 / 20;

// Walkable extent of downtown. The lake starts past maxZ, Queen's Park sits
// near minZ.
export const WORLD_BOUNDS = { minX: -78, maxX: 78, minZ: -78, maxZ: 60 } as const;

const rotateY = (v: Vec2, angle: number): Vec2 => ({
  x: v.x * Math.cos(angle) + v.z * Math.sin(angle),
  z: -v.x * Math.sin(angle) + v.z * Math.cos(angle),
});

const shortestArc = (from: number, to: number) => {
  const raw = (to - from) % (Math.PI * 2);
  if (raw > Math.PI) return raw - Math.PI * 2;
  if (raw < -Math.PI) return raw + Math.PI * 2;
  return raw;
};

type StepOptions = {
  readonly state: PlayerState;
  readonly input: MoveInput;
  // Y rotation of the follow camera; movement input is relative to it.
  readonly cameraYaw: number;
  readonly colliders: readonly RectCollider[];
  readonly dt: number;
  // Multiplies top speed; the exhibit speedrun uses > 1.
  readonly speedScale?: number;
};

/**
 * Advances the player one frame: camera-relative acceleration with exponential
 * approach to top speed, friction when idle, collision pushout with sliding,
 * bounds clamping, and shortest-arc turning toward the direction of travel.
 * Pure and frame-rate independent.
 */
export function stepPlayer({
  state,
  input,
  cameraYaw,
  colliders,
  dt,
  speedScale = 1,
}: StepOptions): PlayerState {
  const clampedDt = Math.min(dt, MAX_DT);
  const worldDir = rotateY({ x: input.x, z: input.z }, cameraYaw);
  const topSpeed = WALK_SPEED * (input.running ? RUN_MULTIPLIER : 1) * speedScale;
  const target = { x: worldDir.x * topSpeed, z: worldDir.z * topSpeed };

  const blend = 1 - Math.exp(-ACCEL_RATE * clampedDt);
  const velocity = {
    x: state.velocity.x + (target.x - state.velocity.x) * blend,
    z: state.velocity.z + (target.z - state.velocity.z) * blend,
  };

  const unclamped = {
    x: state.position.x + velocity.x * clampedDt,
    z: state.position.z + velocity.z * clampedDt,
  };
  const resolved = resolveColliders(unclamped, PLAYER_RADIUS, colliders);
  const position = {
    x: Math.min(Math.max(resolved.x, WORLD_BOUNDS.minX + PLAYER_RADIUS), WORLD_BOUNDS.maxX - PLAYER_RADIUS),
    z: Math.min(Math.max(resolved.z, WORLD_BOUNDS.minZ + PLAYER_RADIUS), WORLD_BOUNDS.maxZ - PLAYER_RADIUS),
  };

  const speed = Math.hypot(velocity.x, velocity.z);
  const heading =
    speed < 0.1
      ? state.heading
      : state.heading +
        shortestArc(state.heading, Math.atan2(velocity.x, velocity.z)) *
          (1 - Math.exp(-TURN_RATE * clampedDt));

  const grounded = state.y <= 0 && state.vy <= 0;
  const launched = grounded && input.jump;
  const vy = launched ? JUMP_SPEED : state.vy - GRAVITY * clampedDt;
  const y = grounded && !launched ? 0 : Math.max(0, state.y + vy * clampedDt);
  const settled = y === 0 && vy < 0;

  return { position, velocity, heading, y, vy: settled ? 0 : vy };
}
