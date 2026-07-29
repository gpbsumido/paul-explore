import type { Vec2 } from "@/types/world";
import { STREETCAR_ROUTE } from "./cityLayout";

// The 501 Queen: a deterministic shuttle you can actually board. One pure
// function drives both the rendered streetcar and the ride mechanic, so the
// car you see is exactly the car you're standing on — and like the real
// thing, it pauses at every stop long enough for you to get on.

export const STREETCAR_SPEED = 9;
export const DWELL_SECONDS = 4;
export const BOARD_RADIUS = 3.5;
// Riders stand on the north running board, hanging off the car body.
export const RIDE_OFFSET = -1.35;

export type StreetcarState = {
  readonly x: number;
  readonly z: number;
  // 1 travelling east, -1 travelling west.
  readonly direction: 1 | -1;
  readonly dwelling: boolean;
};

export type Stop = {
  readonly name: string;
  readonly x: number;
};

export const STREETCAR_STOPS: readonly Stop[] = [
  { name: "Queen & Spadina", x: -60 },
  { name: "Queen & University", x: -30 },
  { name: "Queen & Bay", x: -6 },
  { name: "Queen & Yonge", x: 18 },
  { name: "Queen & Church", x: 42 },
];

type Leg = {
  readonly fromX: number;
  readonly toX: number;
  readonly duration: number;
  readonly direction: 1 | -1;
  readonly dwelling: boolean;
};

const buildSchedule = (): readonly Leg[] => {
  const stopXs = [...STREETCAR_STOPS].map((s) => s.x).sort((a, b) => a - b);
  const marks = [STREETCAR_ROUTE.minX, ...stopXs, STREETCAR_ROUTE.maxX];

  const eastbound = marks.slice(0, -1).flatMap((fromX, i): Leg[] => {
    const toX = marks[i + 1];
    const run: Leg = {
      fromX,
      toX,
      duration: Math.abs(toX - fromX) / STREETCAR_SPEED,
      direction: 1,
      dwelling: false,
    };
    // Every mark except the far terminus is a stop worth pausing at.
    const isStop = i + 1 < marks.length - 1;
    return isStop
      ? [run, { fromX: toX, toX, duration: DWELL_SECONDS, direction: 1, dwelling: true }]
      : [run];
  });

  const westbound = [...eastbound].reverse().map(
    (leg): Leg => ({
      fromX: leg.toX,
      toX: leg.fromX,
      duration: leg.duration,
      direction: -1,
      dwelling: leg.dwelling,
    }),
  );

  return [...eastbound, ...westbound];
};

const SCHEDULE = buildSchedule();

export const ROUTE_CYCLE = SCHEDULE.reduce((total, leg) => total + leg.duration, 0);

/** Where the 501 is at a given moment on the world clock. */
export function streetcarAt(seconds: number): StreetcarState {
  const phase = ((seconds % ROUTE_CYCLE) + ROUTE_CYCLE) % ROUTE_CYCLE;
  let remaining = phase;
  for (const leg of SCHEDULE) {
    if (remaining > leg.duration) {
      remaining -= leg.duration;
      continue;
    }
    const progress = leg.duration > 0 ? remaining / leg.duration : 0;
    return {
      x: leg.fromX + (leg.toX - leg.fromX) * progress,
      z: STREETCAR_ROUTE.z,
      direction: leg.direction,
      dwelling: leg.dwelling,
    };
  }
  return { x: STREETCAR_ROUTE.minX, z: STREETCAR_ROUTE.z, direction: 1, dwelling: false };
}

/** The stop the player is waiting at, if they're close enough to flag it. */
export function nearestStop(pos: Vec2): Stop | null {
  if (Math.abs(pos.z - STREETCAR_ROUTE.z) > BOARD_RADIUS) return null;
  return STREETCAR_STOPS.find((stop) => Math.abs(pos.x - stop.x) <= BOARD_RADIUS) ?? null;
}

/** Whether the car is at this stop right now, doors effectively open. */
export function carIsAtStop(car: StreetcarState, stop: Stop): boolean {
  return Math.abs(car.x - stop.x) <= BOARD_RADIUS;
}

// The car body, for anyone bold enough to climb on top of it.
export const CAR_HALF_LENGTH = 3.5;
export const CAR_HALF_WIDTH = 1.6;
export const ROOF_HEIGHT = 2.15;

/** Whether a position is over the car's roof — the landing zone for a jump. */
export function isOverCarRoof(pos: Vec2, car: StreetcarState): boolean {
  return (
    Math.abs(pos.x - car.x) <= CAR_HALF_LENGTH && Math.abs(pos.z - car.z) <= CAR_HALF_WIDTH
  );
}

/**
 * Whether a jump ends on the roof: over the car, coming down, and high enough
 * to clear it. Anything lower just walks past the side of the streetcar.
 */
export function landsOnRoof(
  pos: Vec2,
  playerY: number,
  playerVy: number,
  car: StreetcarState,
): boolean {
  if (!isOverCarRoof(pos, car)) return false;
  if (playerVy > 0) return false;
  return playerY >= ROOF_HEIGHT - 0.55 && playerY <= ROOF_HEIGHT + 1.6;
}
