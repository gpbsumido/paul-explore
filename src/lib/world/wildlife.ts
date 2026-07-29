import type { Vec2 } from "@/types/world";

// Toronto's other residents. Raccoons waddle a short patrol and scatter when
// you get too close, which is the most accurate thing in this entire city.

export type Raccoon = {
  readonly id: string;
  readonly patrol: readonly Vec2[];
};

export type RaccoonState = {
  readonly x: number;
  readonly z: number;
  readonly heading: number;
  readonly fleeing: boolean;
  // Index into the patrol; absent means "heading to the first point".
  readonly leg?: number;
};

export const FLEE_RADIUS = 6;
const WADDLE_SPEED = 1.6;
const BOLT_SPEED = 7;
const ARRIVE_DISTANCE = 0.6;

export const RACCOONS: readonly Raccoon[] = [
  {
    id: "kensington-bin",
    patrol: [
      { x: -70, z: -47 },
      { x: -70, z: -50 },
      { x: -64, z: -50 },
    ],
  },
  {
    id: "queens-park-lawn",
    patrol: [
      { x: -24, z: -62 },
      { x: -36, z: -62 },
      { x: -36, z: -58 },
    ],
  },
  {
    id: "waterfront-patio",
    patrol: [
      { x: 8, z: 51 },
      { x: 20, z: 50 },
      { x: 20, z: 46 },
    ],
  },
  {
    id: "grange-park",
    patrol: [
      { x: -44, z: -22 },
      { x: -52, z: -22 },
      { x: -52, z: -20 },
    ],
  },
  {
    id: "market-alley",
    patrol: [
      { x: 62, z: 26 },
      { x: 62, z: 20 },
      { x: 56, z: 28 },
    ],
  },
];

const stepToward = (
  state: RaccoonState,
  target: Vec2,
  speed: number,
  dt: number,
): { x: number; z: number; heading: number } => {
  const dx = target.x - state.x;
  const dz = target.z - state.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 1e-4) return { x: state.x, z: state.z, heading: state.heading };
  const travel = Math.min(speed * dt, distance);
  return {
    x: state.x + (dx / distance) * travel,
    z: state.z + (dz / distance) * travel,
    heading: Math.atan2(dx, dz),
  };
};

/**
 * One frame of raccoon: bolt directly away from a player who has come too
 * close, otherwise waddle the patrol loop. Frame-rate independent and pure.
 */
export function raccoonStep(
  state: RaccoonState,
  raccoon: Raccoon,
  playerPos: Vec2,
  dt: number,
): RaccoonState {
  const distanceToPlayer = Math.hypot(playerPos.x - state.x, playerPos.z - state.z);
  if (distanceToPlayer < FLEE_RADIUS) {
    const away = {
      x: state.x + (state.x - playerPos.x) * 4,
      z: state.z + (state.z - playerPos.z) * 4,
    };
    return { ...stepToward(state, away, BOLT_SPEED, dt), fleeing: true, leg: state.leg };
  }

  // Advance the leg first so a raccoon standing on its waypoint sets off for
  // the next one instead of stalling there.
  const startLeg = state.leg ?? 0;
  const standingOn = raccoon.patrol[startLeg % raccoon.patrol.length];
  const atWaypoint = Math.hypot(standingOn.x - state.x, standingOn.z - state.z) < ARRIVE_DISTANCE;
  const leg = atWaypoint ? startLeg + 1 : startLeg;
  const target = raccoon.patrol[leg % raccoon.patrol.length];
  const moved = stepToward(state, target, WADDLE_SPEED, dt);
  return { ...moved, fleeing: false, leg };
}
