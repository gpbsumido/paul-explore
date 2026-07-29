import { describe, it, expect } from "vitest";
import { stepPlayer, WALK_SPEED, RUN_MULTIPLIER, WORLD_BOUNDS, PLAYER_RADIUS } from "../movement";
import type { MoveInput, PlayerState } from "@/types/world";

const REST: PlayerState = {
  position: { x: 0, z: 0 },
  velocity: { x: 0, z: 0 },
  heading: 0,
  y: 0,
  vy: 0,
};

const IDLE: MoveInput = { x: 0, z: 0, running: false, jump: false };
const FORWARD: MoveInput = { x: 0, z: -1, running: false, jump: false };

const step = (state: PlayerState, overrides: Partial<Parameters<typeof stepPlayer>[0]> = {}) =>
  stepPlayer({ state, input: IDLE, cameraYaw: 0, colliders: [], dt: 1 / 60, ...overrides });

// Run the simulation for a while so asymptotic behavior (top speed, decay)
// has time to settle.
const simulate = (
  state: PlayerState,
  overrides: Partial<Parameters<typeof stepPlayer>[0]>,
  frames: number,
) => {
  let current = state;
  for (let i = 0; i < frames; i += 1) current = step(current, overrides);
  return current;
};

const speedOf = (state: PlayerState) => Math.hypot(state.velocity.x, state.velocity.z);

describe("stepPlayer", () => {
  it("stays at rest with no input", () => {
    expect(step(REST)).toEqual(REST);
  });

  it("does not mutate the previous state", () => {
    step(REST, { input: FORWARD });
    expect(REST.position).toEqual({ x: 0, z: 0 });
    expect(REST.velocity).toEqual({ x: 0, z: 0 });
  });

  it("accelerates forward input toward -z when the camera looks north", () => {
    const moved = simulate(REST, { input: FORWARD }, 30);
    expect(moved.position.z).toBeLessThan(-1);
    expect(moved.position.x).toBeCloseTo(0);
  });

  it("approaches walk speed but never exceeds it", () => {
    const cruising = simulate(REST, { input: FORWARD }, 240);
    expect(speedOf(cruising)).toBeGreaterThan(WALK_SPEED * 0.95);
    expect(speedOf(cruising)).toBeLessThanOrEqual(WALK_SPEED + 1e-9);
  });

  it("runs faster than walking when the run flag is set", () => {
    const running = simulate(REST, { input: { ...FORWARD, running: true } }, 240);
    expect(speedOf(running)).toBeGreaterThan(WALK_SPEED);
    expect(speedOf(running)).toBeLessThanOrEqual(WALK_SPEED * RUN_MULTIPLIER + 1e-9);
  });

  it("coasts to a stop after input is released", () => {
    const cruising = simulate(REST, { input: FORWARD }, 120);
    const stopped = simulate(cruising, { input: IDLE }, 240);
    expect(speedOf(stopped)).toBeLessThan(0.05);
  });

  it("moves relative to the camera yaw", () => {
    // Camera spun 180° — pressing forward should now move +z.
    const moved = simulate(REST, { input: FORWARD, cameraYaw: Math.PI }, 30);
    expect(moved.position.z).toBeGreaterThan(1);
    expect(Math.abs(moved.position.x)).toBeLessThan(1e-6);
  });

  it("turns the heading to face the direction of travel", () => {
    const east = simulate(REST, { input: { x: 1, z: 0, running: false, jump: false } }, 120);
    expect(east.heading).toBeCloseTo(Math.PI / 2, 1);
  });

  it("takes the shortest arc when turning across the ±π seam", () => {
    const facingNorthish: PlayerState = { ...REST, heading: Math.PI - 0.1 };
    const after = step(facingNorthish, { input: { x: -0.05, z: -0.999, running: false, jump: false } });
    // Target heading is just past π on the negative side; a shortest-arc turn
    // keeps the heading magnitude near π instead of unwinding through 0.
    expect(Math.abs(after.heading)).toBeGreaterThan(Math.PI - 0.2);
  });

  it("clamps the player inside the world bounds", () => {
    const nearEdge: PlayerState = {
      ...REST,
      position: { x: WORLD_BOUNDS.minX + 1, z: 0 },
    };
    const pressed = simulate(nearEdge, { input: { x: -1, z: 0, running: true, jump: false } }, 240);
    expect(pressed.position.x).toBeGreaterThanOrEqual(WORLD_BOUNDS.minX + PLAYER_RADIUS - 1e-9);
  });

  it("blocks movement into a collider but slides along it", () => {
    const wall = { x: 0, z: -3, halfX: 40, halfZ: 1 };
    const pushing = simulate(
      REST,
      { input: { x: 0.7071, z: -0.7071, running: false, jump: false }, colliders: [wall] },
      120,
    );
    // Stopped at the wall face (z = -2) minus the player radius, but still
    // traveling east along it.
    expect(pushing.position.z).toBeGreaterThanOrEqual(-2 - PLAYER_RADIUS - 1e-9);
    expect(pushing.position.x).toBeGreaterThan(2);
  });

  it("is stable across different frame rates", () => {
    const at60 = simulate(REST, { input: FORWARD, dt: 1 / 60 }, 120);
    const at30 = simulate(REST, { input: FORWARD, dt: 1 / 30 }, 60);
    // Two seconds of travel should land in roughly the same place regardless
    // of the frame rate driving the loop.
    expect(at30.position.z).toBeCloseTo(at60.position.z, 0);
  });

  it("clamps huge dt spikes (tab switch) instead of teleporting", () => {
    const spike = step(REST, { input: FORWARD, dt: 5 });
    expect(Math.abs(spike.position.z)).toBeLessThan(1);
  });

  it("scales top speed for the exhibit speedrun", () => {
    const normal = simulate(REST, { input: FORWARD }, 240);
    const boosted = simulate(REST, { input: FORWARD, speedScale: 2 }, 240);
    expect(speedOf(boosted)).toBeGreaterThan(speedOf(normal) * 1.8);
  });

  describe("jumping", () => {
    const JUMP: MoveInput = { ...IDLE, jump: true };

    it("launches off the ground when jump is pressed", () => {
      const airborne = step(REST, { input: JUMP });
      expect(airborne.y).toBeGreaterThan(0);
      expect(airborne.vy).toBeGreaterThan(0);
    });

    it("arcs up and comes back down to the ground", () => {
      let current = step(REST, { input: JUMP });
      let apex = 0;
      for (let i = 0; i < 120; i += 1) {
        current = step(current, { input: IDLE });
        apex = Math.max(apex, current.y);
      }
      expect(apex).toBeGreaterThan(1);
      expect(current.y).toBe(0);
      expect(current.vy).toBe(0);
    });

    it("cannot double-jump mid-air", () => {
      const first = step(REST, { input: JUMP });
      const coasting = step(first, { input: IDLE });
      const midAir = step(coasting, { input: JUMP });
      // Holding jump in the air must not add upward speed.
      expect(midAir.vy).toBeLessThan(coasting.vy);
    });

    it("keeps horizontal movement while airborne", () => {
      const running = simulate(REST, { input: FORWARD }, 60);
      const jumped = step(running, { input: { ...FORWARD, jump: true } });
      const later = simulate(jumped, { input: FORWARD }, 10);
      expect(later.position.z).toBeLessThan(jumped.position.z);
      expect(later.y).toBeGreaterThan(0);
    });

    it("stays grounded when jump is not pressed", () => {
      const walked = simulate(REST, { input: FORWARD }, 60);
      expect(walked.y).toBe(0);
      expect(walked.vy).toBe(0);
    });
  });
});
